SELECT * FROM User;
SELECT * FROM Location;
SELECT * FROM BucketList;
SELECT * FROM hotel;
SELECT * FROM city;

CREATE TABLE User (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    RegistrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Location Table
CREATE TABLE Location (
    LocationID INT PRIMARY KEY AUTO_INCREMENT,
    LocationName VARCHAR(100) NOT NULL,
    CityID INT,
    Description TEXT,
    FOREIGN KEY (CityID) REFERENCES City(CityID)
);

CREATE TABLE City (
    CityID INT PRIMARY KEY AUTO_INCREMENT,
    CityName VARCHAR(50) NOT NULL UNIQUE,
    Country VARCHAR(50) NOT NULL
);


-- 3. Hotel Table
CREATE TABLE Hotel (
    HotelID INT PRIMARY KEY AUTO_INCREMENT,
    HotelName VARCHAR(100) NOT NULL,
    CityID INT,
    Price DECIMAL(10, 2),
    Rating DECIMAL(2, 1),
    Description TEXT,  -- Optional addition for hotel info
    FOREIGN KEY (CityID) REFERENCES City(CityID) ON DELETE SET NULL
);



-- 4. BucketList Table
CREATE TABLE BucketList (
    ListID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    ListName VARCHAR(100) NOT NULL,
    Privacy ENUM('Public', 'Private') DEFAULT 'Private',
    CreationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
);

-- 5. BucketListLocations Table (Many-to-Many Relationship between BucketList and Location)
CREATE TABLE BucketListLocations (
    BucketListID INT,
    LocationID INT,
    PRIMARY KEY (BucketListID, LocationID),
    FOREIGN KEY (BucketListID) REFERENCES BucketList(ListID) ON DELETE CASCADE,
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID) ON DELETE CASCADE
);

-- 6. Journal Table
CREATE TABLE Journal (
    JournalID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    JournalName VARCHAR(100) NOT NULL,
    Privacy ENUM('Public', 'Private') DEFAULT 'Private',
    CreationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
);

-- 7. JournalEntries Table (One-to-Many Relationship with Journal)
CREATE TABLE JournalEntries (
    EntryID INT PRIMARY KEY AUTO_INCREMENT,
    JournalID INT NOT NULL,
    LocationID INT NOT NULL,  -- Keeping NOT NULL for LocationID
    EntryText TEXT,
    Photos VARCHAR(255),  -- Assuming Photos as a URL or file path reference
    DateVisited DATE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (JournalID) REFERENCES Journal(JournalID) ON DELETE CASCADE,
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID) ON DELETE CASCADE  -- Change to CASCADE
);


-- 8. LocationReviews Table
CREATE TABLE LocationReviews (
    ReviewID INT PRIMARY KEY AUTO_INCREMENT,
    LocationID INT NOT NULL,
    UserID INT NOT NULL,
    Rating DECIMAL(2, 1) CHECK (Rating >= 1.0 AND Rating <= 5.0),
    Comment TEXT,
    SubmissionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
);

-- 9. HotelReviews Table
CREATE TABLE HotelReviews (
    ReviewID INT PRIMARY KEY AUTO_INCREMENT, 
    HotelID INT NOT NULL,
    UserID INT NOT NULL,
    Rating DECIMAL(2, 1) CHECK (Rating >= 1.0 AND Rating <= 5.0),
    Comment TEXT,
    SubmissionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (HotelID) REFERENCES Hotel(HotelID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
);
  
SELECT u.Username, b.ListName, b.Privacy
FROM User u
JOIN BucketList b ON u.UserID = b.UserID;

SELECT u.Username, lr.Comment, l.LocationName, lr.Rating
FROM LocationReviews lr
JOIN User u ON lr.UserID = u.UserID
JOIN Location l ON lr.LocationID = l.LocationID;

SELECT b.ListName, l.LocationName
FROM BucketList b
JOIN BucketListLocations bl ON b.ListID = bl.BucketListID
JOIN Location l ON bl.LocationID = l.LocationID;

SELECT j.JournalName, je.EntryText, je.DateVisited
FROM Journal j
JOIN JournalEntries je ON j.JournalID = je.JournalID;

SELECT l.LocationName, lr.Comment AS LocationReview, hr.Comment AS HotelReview
FROM Location l
LEFT JOIN LocationReviews lr ON l.LocationID = lr.LocationID
LEFT JOIN Hotel h ON l.LocationID = h.LocationID
LEFT JOIN HotelReviews hr ON h.HotelID = hr.HotelID;

SELECT u.Username
FROM User u
LEFT JOIN LocationReviews lr ON u.UserID = lr.UserID
WHERE lr.ReviewID IS NULL;

SELECT u.Username, COUNT(b.ListID) AS BucketListCount
FROM User u
LEFT JOIN BucketList b ON u.UserID = b.UserID
GROUP BY u.Username;

SELECT u.Username, j.JournalName, COUNT(je.EntryID) AS EntryCount
FROM User u
JOIN Journal j ON u.UserID = j.UserID
JOIN JournalEntries je ON j.JournalID = je.JournalID
GROUP BY u.Username, j.JournalName;

SELECT l.LocationName, COUNT(lr.ReviewID) AS ReviewCount
FROM Location l
LEFT JOIN LocationReviews lr ON l.LocationID = lr.LocationID
GROUP BY l.LocationName;

SELECT l.LocationName, COUNT(lr.ReviewID) AS ReviewCount
FROM Location l
JOIN LocationReviews lr ON l.LocationID = lr.LocationID
GROUP BY l.LocationName
ORDER BY ReviewCount DESC
LIMIT 5;


select * from location;
select * from user;
ALTER TABLE Location
ADD COLUMN City VARCHAR(50) AFTER Country;

ALTER TABLE Location
DROP COLUMN CategoryID;


SELECT Hotel.HotelID, Hotel.HotelName, Hotel.Price, Hotel.Rating, Location.City 
FROM Hotel
JOIN Location ON Hotel.LocationID = Location.LocationID
WHERE LOWER(Location.City) = LOWER('Lahore');

SET SQL_SAFE_UPDATES = 0;

UPDATE Location SET City = 'Paris' WHERE LocationName = 'Eiffel Tower';
UPDATE Location SET City = 'Beijing' WHERE LocationName = 'Great Wall of China';
UPDATE Location SET City = 'Cusco' WHERE LocationName = 'Machu Picchu';
UPDATE Location SET City = 'Lahore' WHERE LocationName IN ('Badshahi Mosque', 'Lahore Fort', 'ITU');


ALTER TABLE Location MODIFY City VARCHAR(50) NOT NULL;


-- Remove existing columns
ALTER TABLE Location
DROP COLUMN City,
DROP COLUMN Country;

-- Add CityID column
ALTER TABLE Location
ADD COLUMN CityID INT,
ADD CONSTRAINT FK_City
FOREIGN KEY (CityID) REFERENCES City(CityID);

INSERT INTO City (CityName, Country)
SELECT DISTINCT City, Country FROM Location;

ALTER TABLE Hotel
DROP FOREIGN KEY Hotel_ibfk_1,  -- Replace with the actual constraint name if different
DROP COLUMN LocationID;

ALTER TABLE Hotel
ADD COLUMN CityID INT,
ADD CONSTRAINT FK_Hotel_City
FOREIGN KEY (CityID) REFERENCES City(CityID);

DELETE FROM locationreviews;

ALTER TABLE Hotel
ADD COLUMN Description TEXT;

SELECT l.LocationID, l.LocationName, l.Description, AVG(r.Rating) AS AverageRating
        FROM Location l
        JOIN LocationReviews r ON l.LocationID = r.LocationID
        GROUP BY l.LocationID
        ORDER BY AverageRating DESC
        LIMIT 10;
        
        SELECT 
            L.LocationID, 
            L.LocationName, 
            L.Description,
            C.CityName,
            AVG(R.Rating) AS AverageRating
        FROM 
            Location L
        JOIN 
            City C ON L.CityID = C.CityID
        JOIN 
            LocationReviews R ON L.LocationID = R.LocationID
        GROUP BY 
            L.LocationID, L.LocationName, L.Description, C.CityName
        ORDER BY 
            AverageRating DESC
        LIMIT 10;

