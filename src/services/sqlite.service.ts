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


@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;

  constructor(private platform: Platform) {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

    async initializeDatabase(): Promise<void> {
        try {
            console.log('Initializing database');

            if (this.platform.IOS || this.platform.ANDROID) 
            {
                const retCC = (await this.sqlite.checkConnectionsConsistency()).result;
                const isConnection = (await this.sqlite.isConnection('appDB', false)).result;

                if (!isConnection && !retCC) 
                {
                    // Create a new connection
                    console.log('Creating a new connection');
                    this.db = await this.sqlite.createConnection('appDB', false, 'no-encryption', 1, false);
                    await this.db.open();
                    await this.createTables();
                } 
                else {
                    // Retrieve an existing connection
                    console.log('Retrieved existing connection');
                    this.db = await this.sqlite.retrieveConnection('appDB', false);
                    await this.db.open();
                }
            } 
        } catch (error) {
            console.error('Error initializing the database:', error);
        }
    }

    private async createTables(): Promise<void> {
        if (!this.db) throw new Error('Database connection is not open');


        console.log("Creating episodes table in database");
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


        console.log("Creating movies table in database");
        const createMovieTableQuery = `
            CREATE TABLE IF NOT EXISTS movies (
                id INTEGER PRIMARY KEY NOT NULL,
                original_title TEXT NOT NULL,
                poster_path TEXT NOT NULL,
                status INTEGER NOT NULL,
                timesWatched INTEGER NOT NULL
            );
            `;

        await this.db.execute(createMovieTableQuery);


        console.log("Creating Shows table in database");
        const createShowTableQuery = `
            CREATE TABLE IF NOT EXISTS shows (
                id INTEGER PRIMARY KEY NOT NULL,
                original_title TEXT NOT NULL,
                poster_path TEXT NOT NULL,
                status INTEGER NOT NULL,
                timesWatched INTEGER NOT NULL
            );
            `;
        await this.db.execute(createShowTableQuery);
    }

    async closeDatabase(): Promise<void> {
        if (this.db) {
        await this.sqlite.closeConnection('appDB', false);
        this.db = null;
        }
    }

    // -------------------------------- CRUD OPERATIONS FOR MOVIEs -------------------------------- //


    async addMovie(movie: SimpleDatabaseObject): Promise<void> {
        console.log("Adding movie to database");
        if (!this.db) throw new Error('Database connection is not open');
        const insertQuery = `INSERT INTO movies (id, original_title, poster_path, status, timesWatched) VALUES (?, ?, ?, ?, ?);`;
        await this.db.run(insertQuery, [movie.id, movie.original_title, movie.poster_path, movie.status, movie.timesWatched]);
    }

    async getMovies(): Promise<SimpleDatabaseObject[]> {
        console.log("Getting movies from database");
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM movies;');
        return result.values || [];
    }

    async getMovieById(id: number): Promise<SimpleDatabaseObject> {
        console.log("Getting movie by id from database");
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM movies WHERE id = ?;', [id]);
        return result.values ? result.values[0] || EmptyDatabaseObject : EmptyDatabaseObject;
    }

    async updateMovie(movie: SimpleDatabaseObject): Promise<void> {
        console.log("Updating movie in database");
        if (!this.db) throw new Error('Database connection is not open');
        const updateQuery = `UPDATE movies SET original_title = ?, poster_path = ?, status = ?, timesWatched = ? WHERE id = ?;`;
        await this.db.run(updateQuery, [movie.original_title, movie.poster_path, movie.status, movie.timesWatched, movie.id]);
    }

    async deleteMovie(id: number): Promise<void> {
        console.log("Deleting movie from database");
        if (!this.db) throw new Error('Database connection is not open');
        const deleteQuery = `DELETE FROM movies WHERE id = ?;`;
        await this.db.run(deleteQuery, [id]);
    }

    // -------------------------------- CRUD OPERATIONS FOR SHOWS -------------------------------- //

    async addShow(show: SimpleDatabaseObject): Promise<void> {
        console.log("Adding show to database");
        if (!this.db) throw new Error('Database connection is not open');
        const insertQuery = `INSERT INTO shows (id, original_title, poster_path, status, timesWatched) VALUES (?, ?, ?, ?, ?);`;
        await this.db.run(insertQuery, [show.id, show.original_title, show.poster_path, show.status, show.timesWatched]);
    }

    async getShows(): Promise<SimpleDatabaseObject[]> {
        console.log("Getting shows from database");
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM shows;');
        return result.values || [];
    }

    async getShowById(id: number): Promise<SimpleDatabaseObject> {
        console.log("Getting show by id from database");
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM shows WHERE id = ?;', [id]);
        return result.values ? result.values[0] || EmptyDatabaseObject : EmptyDatabaseObject;
    }

    async updateShow(show: SimpleDatabaseObject): Promise<void> {
        console.log("Updating show in database");
        if (!this.db) throw new Error('Database connection is not open');
        const updateQuery = `UPDATE shows SET original_title = ?, poster_path = ?, status = ?, timesWatched = ? WHERE id = ?;`;
        await this.db.run(updateQuery, [show.original_title, show.poster_path, show.status, show.timesWatched, show.id]);
    }

    async deleteShow(id: number): Promise<void> {
        console.log("Deleting show from database");
        if (!this.db) throw new Error('Database connection is not open');
        const deleteQuery = `DELETE FROM shows WHERE id = ?;`;
        await this.db.run(deleteQuery, [id]);
    }

    async isShowInDatabase(id: number): Promise<boolean> {
        console.log("Checking if show is in database");
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM shows WHERE id = ?;', [id]);
        return !!result.values && result.values.length > 0;
    }

    // -------------------------------- CRUD OPERATIONS FOR EPISODES -------------------------------- //

    async addOrUpdateEpisode(show_id: number, season_number: number, episode_number: number, times_watched: number): Promise<void> {
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
        if (!this.db) throw new Error('Database connection is not open');
        const result = await this.db.query('SELECT * FROM episodes WHERE show_id = ?;', [showId]);
        return result.values || [];
    }

    async deleteEpisode(show_id: number, season_number: number, episode_number: number): Promise<void> {
        if (!this.db) throw new Error('Database connection is not open');
        const deleteQuery = `DELETE FROM episodes WHERE show_id = ? AND season_number = ? AND episode_number = ?;`;
        await this.db.run(deleteQuery, [show_id, season_number, episode_number]);
    }

    async deleteAllEpisodesByShowId(showId: number): Promise<void> {
        console.log("Deleting all episodes by show id from database");
        if (!this.db) throw new Error('Database connection is not open');
        const deleteQuery = `DELETE FROM episodes WHERE show_id = ?;`;
        await this.db.run(deleteQuery, [showId]);
    }
}