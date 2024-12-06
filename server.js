// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create a connection to the MySQL database 
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: '1407', // Replace with your MySQL password
    database: 'travelguide' // Replace with your database name
});

// Connect to the database
db.connect(err => {
    if (err) throw err;
    console.log('Connected to the database');
});

// Sample endpoint
app.get('/', (req, res) => {
    res.send('Welcome to the Travel Guide API');
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Register User
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const sql = 'INSERT INTO User (Username, Email, Password) VALUES (?, ?, ?)';
    db.query(sql, [username, email, password], (err, result) => {
        if (err) throw err;
        res.send({ message: 'User registered successfully!', userId: result.insertId });
    });
});

// Login User
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM User WHERE Email = ? AND Password = ?';
    db.query(sql, [email, password], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            res.send({ message: 'Login successful!', user: result[0] });
        } else {
            res.status(401).send({ message: 'Invalid credentials!' });
        }
    });
});


// Location Management Endpoints

// Endpoint to add a new location
app.post('/locations/add', (req, res) => {
    const { locationName, cityName, description, country } = req.body;

    // Input validation
    if (!locationName || !cityName || !description || !country) {
        return res.status(400).send({ message: 'All fields are required.' });
    }

    // Find or insert the city
    const findOrInsertCitySQL = `
        INSERT INTO City (CityName, Country)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE CityID = LAST_INSERT_ID(CityID)
    `;

    // Insert the location into the Location table
    const insertLocationSQL = `
        INSERT INTO Location (LocationName, CityID, Description)
        VALUES (?, ?, ?)
    `;

    db.query(findOrInsertCitySQL, [cityName, country], (err, cityResult) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ message: 'Error inserting or finding city.' });
        }

        const cityID = cityResult.insertId;  // Get the CityID

        // Now insert the location
        db.query(insertLocationSQL, [locationName, cityID, description], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send({ message: 'Error inserting location.' });
            }
            res.status(201).send({ message: 'Location added successfully!', locationID: result.insertId });
        });
    });
});

// Get All Locations
app.get('/locations', (req, res) => {
    const sql = 'SELECT * FROM Location';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching locations:', err);
            return res.status(500).send({ message: 'Error fetching locations' });
        }
        res.send(results);
    });
});

// Endpoint to get locations by city name
app.get('/locations/:cityName', (req, res) => {
    const { cityName } = req.params;

    // SQL query to fetch locations by city name
    const sql = `
        SELECT l.LocationID, l.LocationName, l.Description, c.CityName, c.Country
        FROM Location l
        JOIN City c ON l.CityID = c.CityID
        WHERE LOWER(c.CityName) = LOWER(?)
    `;

    db.query(sql, [cityName], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ message: 'Error fetching locations for the city.' });
        }
        
        if (results.length === 0) {
            return res.status(404).send({ message: 'No locations found for this city.' });
        }

        res.status(200).send(results);
    });
});

// Endpoint to get locations by partial location name
app.get('/location/name/:locationName', (req, res) => {
    const { locationName } = req.params;

    // SQL query to fetch locations matching the partial name (case-insensitive)
    const sql = `
        SELECT l.LocationID, l.LocationName, l.Description, c.CityName, c.Country
        FROM Location l
        JOIN City c ON l.CityID = c.CityID
        WHERE LOWER(l.LocationName) LIKE LOWER(?)
    `;

    db.query(sql, [`%${locationName}%`], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ message: 'Error fetching locations by name.' });
        }

        if (results.length === 0) {
            return res.status(404).send({ message: 'No locations found.' });
        }

        res.status(200).send(results);  // Send all matching locations
    });
});
// Get location by location name and city name


app.get('/location/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM Location WHERE LocationID = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send({ message: 'Error fetching location' });
        } else {
            res.send(result[0]);
        }
    });
});



// Get all hotels
app.get('/hotels', (req, res) => {
    const sql = 'SELECT * FROM Hotel';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send({ message: 'Error fetching hotels' });
        } else {
            res.send(results);
        }
    });
});







// Create a Bucket List
app.post('/bucketlist', (req, res) => {
    const { userId, listName, privacy } = req.body;
    const sql = 'INSERT INTO BucketList (UserID, ListName, Privacy) VALUES (?, ?, ?)';
    db.query(sql, [userId, listName, privacy], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send({ message: 'Error creating bucket list' });
        } else {
            res.send({ message: 'Bucket list created', listId: result.insertId });
        }
    });
});

// Add a Location to a Bucket List
app.post('/bucketlist/:bucketListId/location/:locationId', (req, res) => {
    const { bucketListId, locationId } = req.params; // Get BucketListID and LocationID from URL parameters

    // SQL query to insert a new record in the BucketListLocations table
    const sql = `
        INSERT INTO BucketListLocations (BucketListID, LocationID)
        VALUES (?, ?)
    `;

    db.query(sql, [bucketListId, locationId], (err, result) => {
        if (err) {
            console.error('Error adding location to bucket list:', err);
            return res.status(500).send({ message: 'Error adding location to bucket list' });
        }

        res.status(201).send({ message: 'Location added to bucket list successfully!' });
    });
});




// Create a Journal
app.post('/journal', (req, res) => {
    const { userId, journalName, privacy } = req.body;
    const sql = 'INSERT INTO Journal (UserID, JournalName, Privacy) VALUES (?, ?, ?)';
    db.query(sql, [userId, journalName, privacy], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send({ message: 'Error creating journal' });
        } else {
            res.send({ message: 'Journal created', journalId: result.insertId });
        }
    });
});




// Get Journal Entries by Username
app.get('/journal/username/:username', (req, res) => {
    const { username } = req.params;
    
    // SQL query to fetch journal entries for a given username
    const sql = `
        SELECT j.JournalID, j.JournalName, j.Privacy, je.EntryText, je.EntryDate
        FROM Journal j
        JOIN User u ON j.UserID = u.UserID
        LEFT JOIN JournalEntries je ON j.JournalID = je.JournalID
        WHERE LOWER(u.Username) = LOWER(?)
    `;

    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Error fetching journal entries:', err);
            return res.status(500).send({ message: 'Error fetching journal entries for this username.' });
        }
        
        if (results.length === 0) {
            return res.status(404).send({ message: 'No journal entries found for this username.' });
        }

        res.status(200).send(results);
    });
});




// Get All Journals for a User
app.get('/journals/:userId', (req, res) => {
    const { userId } = req.params;

    // SQL query to get all journals for the user
    const sql = 'SELECT * FROM Journal WHERE UserID = ?';

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching journals:', err);
            return res.status(500).send({ message: 'Error fetching journals' });
        }

        if (results.length === 0) {
            return res.status(404).send({ message: 'No journals found for this user.' });
        }

        res.status(200).send(results);
    });
});


// Get all entries in a journal by JournalID
app.get('/journal/:journalId/entries', (req, res) => {
    const { journalId } = req.params;

    // SQL query to get all entries for the specified journal
    const sql = 'SELECT * FROM JournalEntries WHERE JournalID = ?';

    db.query(sql, [journalId], (err, results) => {
        if (err) {
            console.error('Error fetching journal entries:', err);
            return res.status(500).send({ message: 'Error fetching journal entries' });
        }

        if (results.length === 0) {
            return res.status(404).send({ message: 'No entries found for this journal.' });
        }

        res.status(200).send(results);
    });
});
// Add Entry to a Journal without userId
app.post('/journal/:journalId/entries', (req, res) => {
    const { journalId } = req.params; // Get JournalID from the URL
    const { locationId, entryText, photos, dateVisited } = req.body; // Get locationId, entry text, and other details from request body

    // Input validation
    if (!locationId || !entryText || !dateVisited) {
        return res.status(400).send({ message: 'LocationID, entry text, and date visited are required.' });
    }

    // SQL query to insert a new entry into the JournalEntries table
    const sql = `
        INSERT INTO JournalEntries (JournalID, LocationID, EntryText, Photos, DateVisited)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [journalId, locationId, entryText, photos || null, dateVisited], (err, result) => {
        if (err) {
            console.error('Error adding journal entry:', err);
            return res.status(500).send({ message: 'Error adding journal entry' });
        }

        res.status(201).send({ message: 'Entry added successfully!', entryId: result.insertId });
    });
});

// Delete a Location from a Bucket List
app.delete('/bucketlist/:bucketListId/location/:locationId', (req, res) => {
    const { bucketListId, locationId } = req.params; // Get BucketListID and LocationID from URL parameters

    // SQL query to delete the record from the BucketListLocations table
    const sql = `
        DELETE FROM BucketListLocations
        WHERE BucketListID = ? AND LocationID = ?
    `;

    db.query(sql, [bucketListId, locationId], (err, result) => {
        if (err) {
            console.error('Error deleting location from bucket list:', err);
            return res.status(500).send({ message: 'Error deleting location from bucket list' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Location not found in the bucket list' });
        }

        res.status(200).send({ message: 'Location removed from bucket list successfully!' });
    });
});

// Get Locations in a Bucket List
app.get('/bucketlist/:bucketListId/locations', (req, res) => {
    const { bucketListId } = req.params; // Get BucketListID from URL parameters

    // SQL query to get all locations in the specified bucket list
    const sql = `
        SELECT l.LocationID, l.LocationName, l.Description, c.CityName, c.Country
        FROM Location l
        JOIN BucketListLocations bll ON l.LocationID = bll.LocationID
        JOIN City c ON l.CityID = c.CityID
        WHERE bll.BucketListID = ?
    `;

    db.query(sql, [bucketListId], (err, results) => {
        if (err) {
            console.error('Error fetching locations in the bucket list:', err);
            return res.status(500).send({ message: 'Error fetching locations in the bucket list' });
        }

        if (results.length === 0) {
            return res.status(404).send({ message: 'No locations found in this bucket list' });
        }

        res.status(200).send(results);
    });
});

// Delete Journal Entry
app.delete('/journal/:journalId/entry/:entryId', (req, res) => {
    const { journalId, entryId } = req.params; // Get JournalID and EntryID from URL parameters

    // SQL query to delete the journal entry by EntryID and JournalID
    const sql = `
        DELETE FROM JournalEntries
        WHERE EntryID = ? AND JournalID = ?
    `;

    db.query(sql, [entryId, journalId], (err, results) => {
        if (err) {
            console.error('Error deleting journal entry:', err);
            return res.status(500).send({ message: 'Error deleting journal entry' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).send({ message: 'Entry not found in the specified journal' });
        }

        res.status(200).send({ message: 'Journal entry successfully deleted' });
    });
});



// Delete a Journal and its associated entries
app.delete('/journal/:journalId', (req, res) => {
    const { journalId } = req.params; // Get JournalID from URL parameter

    // Start a transaction to ensure data consistency
    db.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).send({ message: 'Error starting transaction' });
        }

        // First, delete all entries associated with the journal
        const deleteEntriesQuery = 'DELETE FROM JournalEntries WHERE JournalID = ?';
        db.query(deleteEntriesQuery, [journalId], (err) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error deleting journal entries:', err);
                    return res.status(500).send({ message: 'Error deleting journal entries' });
                });
            }

            // Then, delete the journal itself
            const deleteJournalQuery = 'DELETE FROM Journal WHERE JournalID = ?';
            db.query(deleteJournalQuery, [journalId], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error deleting journal:', err);
                        return res.status(500).send({ message: 'Error deleting journal' });
                    });
                }

                // Commit the transaction if both delete operations were successful
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error committing transaction:', err);
                            return res.status(500).send({ message: 'Error committing transaction' });
                        });
                    }

                    res.status(200).send({ message: 'Journal and its entries deleted successfully' });
                });
            });
        });
    });
});


// Create a new journal
app.post('/journal', (req, res) => {
    const { userId, journalName, description } = req.body; // Get data from the request body

    if (!userId || !journalName || !description) {
        return res.status(400).send({ message: 'UserID, JournalName, and Description are required' });
    }

    // SQL query to insert a new journal
    const createJournalQuery = `
        INSERT INTO Journal (UserID, JournalName, Description, CreatedAt)
        VALUES (?, ?, ?, NOW())
    `;

    db.query(createJournalQuery, [userId, journalName, description], (err, result) => {
        if (err) {
            console.error('Error creating journal:', err);
            return res.status(500).send({ message: 'Error creating journal' });
        }

        // Return success response with journal ID
        res.status(201).send({
            message: 'Journal created successfully',
            journalId: result.insertId,
        });
    });
});


// Get all hotels and their ratings in a specific city
app.get('/hotels', (req, res) => {
    const { city } = req.query; // Get city from query parameter

    if (!city) {
        return res.status(400).send({ message: 'City is required' });
    }

    // SQL query to get all hotels and their ratings in the specified city
    const getHotelsQuery = `
        SELECT HotelID, HotelName, Rating
        FROM Hotels
        WHERE City = ?
        ORDER BY Rating DESC;
    `;

    db.query(getHotelsQuery, [city], (err, results) => {
        if (err) {
            console.error('Error retrieving hotels:', err);
            return res.status(500).send({ message: 'Error retrieving hotels' });
        }

        if (results.length === 0) {
            return res.status(404).send({ message: 'No hotels found in this city' });
        }

        // Respond with the list of hotels and their ratings
        res.status(200).send({
            message: 'Hotels retrieved successfully',
            hotels: results,
        });
    });
});


// Add a review for a hotel
app.post('/hotels/review', (req, res) => {
    const { hotelID, userID, rating, comment } = req.body;  // Get hotelID, userID, rating, and comment from the request body

    // Validate the required fields
    if (!hotelID || !userID || !rating || !comment) {
        return res.status(400).send({ message: 'HotelID, UserID, Rating, and Comment are required' });
    }

    // Validate rating is between 1 and 5
    if (rating < 1 || rating > 5) {
        return res.status(400).send({ message: 'Rating must be between 1 and 5' });
    }

    // SQL query to insert a new review for the hotel
    const insertReviewQuery = `
        INSERT INTO HotelReviews (HotelID, UserID, Rating, Comment)
        VALUES (?, ?, ?, ?);
    `;

    db.query(insertReviewQuery, [hotelID, userID, rating, comment], (err, result) => {
        if (err) {
            console.error('Error adding review:', err);
            return res.status(500).send({ message: 'Error adding review' });
        }

        // Respond with success message
        res.status(201).send({
            message: 'Review added successfully',
            reviewID: result.insertId, // Return the ID of the newly added review
        });
    });
});


// Add a review for a location
app.post('/locations/review', (req, res) => {
    const { locationID, userID, rating, comment } = req.body;  // Get locationID, userID, rating, and comment from the request body

    // Validate the required fields
    if (!locationID || !userID || !rating || !comment) {
        return res.status(400).send({ message: 'LocationID, UserID, Rating, and Comment are required' });
    }

    // Validate rating is between 1 and 5
    if (rating < 1 || rating > 5) {
        return res.status(400).send({ message: 'Rating must be between 1 and 5' });
    }

    // SQL query to insert a new review for the location
    const insertReviewQuery = `
        INSERT INTO LocationReviews (LocationID, UserID, Rating, Comment)
        VALUES (?, ?, ?, ?);
    `;

    db.query(insertReviewQuery, [locationID, userID, rating, comment], (err, result) => {
        if (err) {
            console.error('Error adding review:', err);
            return res.status(500).send({ message: 'Error adding review' });
        }

        // Respond with success message
        res.status(201).send({
            message: 'Review added successfully',
            reviewID: result.insertId, // Return the ID of the newly added review
        });
    });
});

// Get all reviews for a specific location
app.get('/locations/:locationID/reviews', (req, res) => {
    const locationID = req.params.locationID;  // Get locationID from URL parameters

    // Validate locationID
    if (!locationID) {
        return res.status(400).send({ message: 'LocationID is required' });
    }

    // SQL query to get all reviews for the specified location
    const getReviewsQuery = `
        SELECT lr.ReviewID, lr.Rating, lr.Comment, lr.SubmissionDate, u.Username
        FROM LocationReviews lr
        JOIN User u ON lr.UserID = u.UserID
        WHERE lr.LocationID = ?
        ORDER BY lr.SubmissionDate DESC;
    `;

    db.query(getReviewsQuery, [locationID], (err, results) => {
        if (err) {
            console.error('Error retrieving reviews:', err);
            return res.status(500).send({ message: 'Error retrieving reviews' });
        }

        if (results.length === 0) {
            return res.status(404).send({ message: 'No reviews found for this location' });
        }

        // Respond with the reviews
        res.status(200).send({
            message: 'Reviews retrieved successfully',
            reviews: results,
        });
    });
});


// Route to get journals of a specific user
app.get('/journals', (req, res) => {
    const { userID } = req.query; // Get the UserID from query parameter

    if (!userID) {
        return res.status(400).json({ message: 'UserID is required' });
    }

    // SQL query to get journals of the user
    const getJournalsQuery = `
        SELECT * FROM Journal WHERE UserID = ?;
    `;

    db.query(getJournalsQuery, [userID], (err, results) => {
        if (err) {
            console.error('Error retrieving journals:', err);
            return res.status(500).json({ message: 'Error retrieving journals' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No journals found for this user' });
        }

        // Respond with the list of journals
        res.status(200).json({
            message: 'Journals retrieved successfully',
            journals: results,
        });
    });
});


// Route to get the journal of a user by their username
app.get('/journal', (req, res) => {
    const { username } = req.query; // Get the Username from query parameter

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    // SQL query to get the journal of a user by username
    const getJournalQuery = `
        SELECT * FROM Journal
        WHERE UserID = (SELECT UserID FROM User WHERE Username = ?);
    `;

    db.query(getJournalQuery, [username], (err, results) => {
        if (err) {
            console.error('Error retrieving journal:', err);
            return res.status(500).json({ message: 'Error retrieving journal' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No journal found for this user' });
        }

        // Respond with the user's journal
        res.status(200).json({
            message: 'Journal retrieved successfully',
            journal: results,
        });
    });
});


// Route to get top-rated locations in a specific city
app.get('/top-rated-locations', (req, res) => {
    const { city } = req.query; // Get city from query parameter

    if (!city) {
        return res.status(400).json({ message: 'City is required' });
    }

    // SQL query to get top-rated locations in a specified city
    const getTopRatedLocationsQuery = `
        SELECT L.LocationID, L.LocationName, AVG(LR.Rating) AS AverageRating
        FROM Location L
        JOIN LocationReviews LR ON L.LocationID = LR.LocationID
        JOIN City C ON L.CityID = C.CityID
        WHERE C.CityName = ?
        GROUP BY L.LocationID
        ORDER BY AverageRating DESC;
    `;

    db.query(getTopRatedLocationsQuery, [city], (err, results) => {
        if (err) {
            console.error('Error retrieving top-rated locations:', err);
            return res.status(500).json({ message: 'Error retrieving top-rated locations' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No locations found in this city' });
        }

        // Respond with the top-rated locations
        res.status(200).json({
            message: 'Top-rated locations retrieved successfully',
            locations: results,
        });
    });
});
