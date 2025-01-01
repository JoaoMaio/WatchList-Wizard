import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Platform } from '@angular/cdk/platform';

export interface SimpleDatabaseObject {
    id: number;
    original_title: string;
    poster_path: string;
    status: number;
    timesWatched: number;
}

export const EmptyDatabaseObject: SimpleDatabaseObject = {
    id: 0,
    original_title: '',
    poster_path: '',
    status: 0,
    timesWatched: 0
}


export interface SimpleEpisodeObject {
    show_id: number;
    season_number: number;
    episode_number: number;
    times_watched: number;
}


export interface SimpleCollectionItem {
    collection_id: number;
    id: number;
    type: string;
    title: string;
    poster_path: string;
}

export interface SimpleCollection {
    id: number;
    name: string;
    timeAdded: string;
}

export interface Collection {
    id: number;
    name: string;
    items: SimpleCollectionItem[];
  }



@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private isDatabaseInitialized = false;
  private seeLaterCreated = false;
  private databaseReady: Promise<void>;

  constructor(private platform: Platform) {
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
      this.databaseReady = this.initializeDatabase();
  }
  
    async initializeDatabase(): Promise<void> {
        if (this.isDatabaseInitialized) {
            return;
        }
    
        try {
            if (this.platform.IOS || this.platform.ANDROID) {
                const retCC = (await this.sqlite.checkConnectionsConsistency()).result;
                const isConnection = (await this.sqlite.isConnection('appDB', false)).result;
    
                if (!isConnection && !retCC) {
                    this.db = await this.sqlite.createConnection('appDB', false, 'no-encryption', 1, false);
                    await this.db.open();
                    await this.createTables();
                } else {
                    this.db = await this.sqlite.retrieveConnection('appDB', false);
                    await this.db.open();
                }
            }
    
            this.isDatabaseInitialized = true;
        } catch (error) {
            console.error('Error initializing the database:', error);
            throw error;
        }
    }
  
    private async createTables(): Promise<void> {
        if (!this.db) throw new Error('Database connection is not open');


        const createTableQuery = `
        CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            show_id INTEGER NOT NULL,
            season_number INTEGER NOT NULL,
            episode_number INTEGER NOT NULL,
            times_watched INTEGER DEFAULT 0
        );
        `;
        await this.db.execute(createTableQuery);


        const createMovieTableQuery = `
            CREATE TABLE IF NOT EXISTS movies (
                id INTEGER PRIMARY KEY NOT NULL,
                original_title TEXT NOT NULL,
                poster_path TEXT NOT NULL,
                status INTEGER NOT NULL,
                timesWatched INTEGER NOT NULL,
                timeAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            `;

        await this.db.execute(createMovieTableQuery);


        const createShowTableQuery = `
            CREATE TABLE IF NOT EXISTS shows (
                id INTEGER PRIMARY KEY NOT NULL,
                original_title TEXT NOT NULL,
                poster_path TEXT NOT NULL,
                status INTEGER NOT NULL,
                timesWatched INTEGER NOT NULL,
                timeAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            `;
        await this.db.execute(createShowTableQuery);


        const createCollectionsItemsTableQuery = `
            CREATE TABLE IF NOT EXISTS collectionItems (
                collection_id INTEGER NOT NULL,
                id INTEGER NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                poster_path TEXT NOT NULL
            );
            `;

        await this.db.execute(createCollectionsItemsTableQuery);

        const createCollectionsTableQuery = `
            CREATE TABLE IF NOT EXISTS collections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                timeAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            `;

        await this.db.execute(createCollectionsTableQuery);


        // add See Later collection
        // check if collection with id 1 exists
        const selectCollectionQuery = `SELECT * FROM collections WHERE id = 1;`;
        const result = await this.db.query(selectCollectionQuery);
        if ((!result.values || result.values.length === 0) && !this.seeLaterCreated) {
            this.seeLaterCreated = true;
            const insertCollectionQuery = `INSERT INTO collections (name, timeAdded) VALUES ('See Later', CURRENT_TIMESTAMP);`;
            await this.db.execute(insertCollectionQuery);
        }
    }

    async dropTables(): Promise<void> {
        if (!this.db) throw new Error('Database connection is not open');
        await this.db.execute(`DROP TABLE IF EXISTS episodes;`);
        await this.db.execute(`DROP TABLE IF EXISTS movies;`);
        await this.db.execute(`DROP TABLE IF EXISTS shows;`);
        await this.db.execute(`DROP TABLE IF EXISTS collectionItems;`);
        await this.db.execute(`DROP TABLE IF EXISTS collections;`);
    
        this.createTables();
    }

    async closeDatabase(): Promise<void> {
        if (this.db) {
            try {
                await this.sqlite.closeConnection('appDB', false);
                this.db = null;
            } catch (error) {
                console.error('Error closing database connection:', error);
            }
        }
    }
    
    private async ensureDatabaseConnection(): Promise<void> {
        await this.databaseReady; // Wait for the initialization to complete
    
        if (!this.db) {
            throw new Error('Database connection object is missing.');
        }
    
        const isOpen = await this.db.isDBOpen();
        if (!isOpen) {
            await this.db.open();
        }
    }
    
    async resetDatabase(): Promise<void> {
        await this.dropTables();
        await this.createTables();
    }
    
    
    
    // -------------------------------- CRUD OPERATIONS FOR MOVIEs -------------------------------- //


    async addOrUpdateMovie(movie: SimpleDatabaseObject): Promise<void> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        
        const selectQuery = `SELECT * FROM movies WHERE id = ?;`;
        const result = await this.db.query(selectQuery, [movie.id]);
        
        if (result.values && result.values.length > 0) {
            const updateQuery = `UPDATE movies SET original_title = ?, poster_path = ?, status = ?, timesWatched = ? WHERE id = ?;`;
            await this.db.run(updateQuery, [movie.original_title, movie.poster_path, movie.status, movie.timesWatched, movie.id]);
        } else {
            const insertQuery = `INSERT INTO movies (id, original_title, poster_path, status, timesWatched, timeAdded) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`;
            await this.db.run(insertQuery, [movie.id, movie.original_title, movie.poster_path, movie.status, movie.timesWatched]);
        }
    }

    async getMovies(): Promise<SimpleDatabaseObject[]> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM movies;');
        return result.values || [];
    }

    async getMovieById(id: number): Promise<SimpleDatabaseObject> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM movies WHERE id = ?;', [id]);
        return result.values ? result.values[0] || EmptyDatabaseObject : EmptyDatabaseObject;
    }

    async deleteMovie(id: number): Promise<void> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const deleteQuery = `DELETE FROM movies WHERE id = ?;`;
        await this.db.run(deleteQuery, [id]);
    }

    async getLastXMovies(limit: number): Promise<SimpleDatabaseObject[]> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM movies ORDER BY timeAdded DESC LIMIT ?;', [limit]);
        return result.values || [];
    }

    // -------------------------------- CRUD OPERATIONS FOR SHOWS -------------------------------- //

    async addOrUpdateShow(show: SimpleDatabaseObject): Promise<void> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        
        const selectQuery = `SELECT * FROM shows WHERE id = ?;`;
        const result = await this.db.query(selectQuery, [show.id]);
        
        if (result.values && result.values.length > 0) {
            const updateQuery = `UPDATE shows SET original_title = ?, poster_path = ?, status = ?, timesWatched = ? WHERE id = ?;`;
            await this.db.run(updateQuery, [show.original_title, show.poster_path, show.status, show.timesWatched, show.id]);
        } else {
            const insertQuery = `INSERT INTO shows (id, original_title, poster_path, status, timesWatched, timeAdded) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`;
            await this.db.run(insertQuery, [show.id, show.original_title, show.poster_path, show.status, show.timesWatched]);
        }
    }

    async getShows(): Promise<SimpleDatabaseObject[]> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM shows;');
        return result.values || [];
    }

    async getShowById(id: number): Promise<SimpleDatabaseObject> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM shows WHERE id = ?;', [id]);
        return result.values ? result.values[0] || EmptyDatabaseObject : EmptyDatabaseObject;
    }

    async deleteShow(id: number): Promise<void> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const deleteQuery = `DELETE FROM shows WHERE id = ?;`;
        await this.db.run(deleteQuery, [id]);
    }

    async isShowInDatabase(id: number): Promise<boolean> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM shows WHERE id = ?;', [id]);
        return !!result.values && result.values.length > 0;
    }

    async getLastXShows(limit: number): Promise<SimpleDatabaseObject[]> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM shows ORDER BY timeAdded DESC LIMIT ?;', [limit]);
        return result.values || [];
    }

    // -------------------------------- CRUD OPERATIONS FOR EPISODES -------------------------------- //

    async addOrUpdateEpisode(show_id: number, season_number: number, episode_number: number, times_watched: number): Promise<void> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        
        const selectQuery = `SELECT * FROM episodes WHERE show_id = ? AND season_number = ? AND episode_number = ?;`;
        const result = await this.db.query(selectQuery, [show_id, season_number, episode_number]);
        
        if (result.values && result.values.length > 0) {
            const updateQuery = `UPDATE episodes SET times_watched = ? WHERE show_id = ? AND season_number = ? AND episode_number = ?;`;
            await this.db.run(updateQuery, [times_watched, show_id, season_number, episode_number]);
        } else {
            const insertQuery = `INSERT INTO episodes (show_id, season_number, episode_number, times_watched) VALUES (?, ?, ?, ?);`;
            await this.db.run(insertQuery, [show_id, season_number, episode_number, times_watched]);
        }
    }

    async getEpisodesByShowId(showId: number): Promise<SimpleEpisodeObject[]> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM episodes WHERE show_id = ?;', [showId]);
        return result.values || [];
    }

    async deleteEpisode(show_id: number, season_number: number, episode_number: number): Promise<void> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const deleteQuery = `DELETE FROM episodes WHERE show_id = ? AND season_number = ? AND episode_number = ?;`;
        await this.db.run(deleteQuery, [show_id, season_number, episode_number]);
    }

    async deleteAllEpisodesByShowId(showId: number): Promise<void> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const deleteQuery = `DELETE FROM episodes WHERE show_id = ?;`;
        await this.db.run(deleteQuery, [showId]);
    }

    /// -------------------------------- CRUD OPERATIONS FOR COLLECTIONS -------------------------------- ///

    async addCollection(name: string): Promise<void> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        
        const insertQuery = `INSERT INTO collections (name, timeAdded) VALUES (?, CURRENT_TIMESTAMP);`;
        await this.db.run(insertQuery, [name]);
    }

    async getCollections(): Promise<Collection[]> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM collections;');

        if (result.values) 
        {
            var collectionsObject: Collection[] = [];
            for (const collection of result.values) {
                const items = await this.getCollectionItems(collection.id);
                collectionsObject.push({
                    id: collection.id,
                    name: collection.name,
                    items: items,
                });
            }
            return collectionsObject;
        }
        
        return [];
    }
    
    async deleteCollection(id: number): Promise<void> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const deleteQuery = `DELETE FROM collections WHERE id = ?;`;
        await this.db.run(deleteQuery, [id]);
    }

    async addCollectionItem(collection_id: number, id: number, type: string, title: string, poster_path: string): Promise<void> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        
        const insertQuery = `INSERT INTO collectionItems (collection_id, id, type, title, poster_path) VALUES (?, ?, ?, ?, ?);`;
        await this.db.run(insertQuery, [collection_id, id, type, title, poster_path]);
    }

    async getCollectionItems(collection_id: number): Promise<SimpleCollectionItem[]> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM collectionItems WHERE collection_id = ?;', [collection_id]);
        return result.values || [];
    }

    async deleteCollectionItem(collection_id: number, id: number): Promise<void> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const deleteQuery = `DELETE FROM collectionItems WHERE collection_id = ? AND id = ?;`;
        await this.db.run(deleteQuery, [collection_id, id]);
    }

    async deleteAllCollectionItems(collection_id: number): Promise<void> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const deleteQuery = `DELETE FROM collectionItems WHERE collection_id = ?;`;
        await this.db.run(deleteQuery, [collection_id]);
    }

    async deleteAllCollections(): Promise<void> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const deleteQuery = `DELETE FROM collections;`;
        await this.db.run(deleteQuery);
    }    

    async checkIfIsInSeeLater(id: number, type: string): Promise<boolean> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM collectionItems WHERE collection_id = 1 AND id = ? AND type = ?;', [id, type]);
        return !!result.values && result.values.length > 0;
    }

    async addToSeeLater(id: number, type: string, title: string, poster_path: string): Promise<void> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
    
        // Check if the record already exists
        const existingItem = await this.db.query(
            `SELECT * FROM collectionItems WHERE collection_id = ? AND id = ?`,
            [1, id]
        );
    
        if (existingItem.values && existingItem.values.length > 0) {
            return; 
        }
    
        // Insert the new record
        const insertQuery = `INSERT INTO collectionItems (collection_id, id, type, title, poster_path) VALUES (?, ?, ?, ?, ?);`;
        await this.db.run(insertQuery, [1, id, type, title, poster_path]);
    }
    

    async getCollection(id: number): Promise<Collection> {
        await this.ensureDatabaseConnection();
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM collections WHERE id = ?;', [id]);
        const collection = result.values ? result.values[0] : null;

        if (collection) {
            const items = await this.getCollectionItems(collection.id);
            return {
                id: collection.id,
                name: collection.name,
                items: items
            };
        }

        return {id: 0, name: '', items: []};
    }

}