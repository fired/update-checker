
# Update Checker

## Overview

Update Checker is a web application designed to scrape various websites to check and store the latest versions of different software. It provides an easy way to keep track of software updates from a centralized location.

## Features

-   **Scraping Functions**: Dedicated functions to scrape specific websites for software versions.
-   **Scheduled Updates**: Uses `cron` to schedule regular updates of software versions.
-   **Version Storage**: Stores the latest and previous versions of software in a JSON file.
-   **Web Interface**: Serves a web interface from the `public` directory to view the stored versions.

## Setup

1.  Clone the repository.
2.  Install the required dependencies using `npm install`.
3.  Run the application using `node app.js`.
4.  Access the web interface at `http://localhost:3000`.

## Supported Software

The application currently supports checking updates for the following software:

-   Apache Tomcat
-   Apache Httpd
-   Azure AD Connect
-   BIND
-   Bitwarden
-   Cacti
-   Chrony
-   FreeRADIUS
- Glacier
- GAM
- GAPS
- GCDS
- JAMF
- Katalon
- MariaDB
- Mathematica
- Microsoft 365
- MySQL
- Postfix

## Screenshots
![page](https://www.thenameisblondy.com/u/WgGONP.png)

## Contributing

Feel free to contribute by adding more scraping functions or improving the existing ones. Ensure to follow the coding standards and add comments where necessary
