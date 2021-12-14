CREATE TABLE breeds (
  id SERIAL PRIMARY KEY,
  breed TEXT NOT NULL,
  image_url TEXT NOT NULL,
  votes INT DEFAULT 1
);