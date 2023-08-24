const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const https = require('https');
const puppeteer = require('puppeteer');
const express = require('express');

const app = express();
const port = 3000;
const filePath = 'website_versions.json';

app.use(express.static('public'));

const getStoredVersions = () => {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }
    return {};
};

let websiteVersions = getStoredVersions();

const saveVersionsToFile = (versions) => {
    fs.writeFileSync(filePath, JSON.stringify(versions, null, 2), 'utf8');
};

const updateVersion = (url, newVersion) => {
    if (!websiteVersions[url]) {
        websiteVersions[url] = {
            current: newVersion,
            prev: newVersion
        };
    } else if (websiteVersions[url].current !== newVersion) {
        websiteVersions[url].prev = websiteVersions[url].current;
        websiteVersions[url].current = newVersion;
    }
};


const scrapeTomcat = async () => {
    const url = 'https://tomcat.apache.org/download-10.cgi';
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        const versionText = $('div#mainRight h3').last().text().trim();

        return versionText || "Version not found";
        
    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeHttpd = async () => {
    const url = 'https://httpd.apache.org/';
    
    const versionRegex = /(\d+\.\d+\.\d+)/;  // This regex matches patterns like "2.4.57"

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let versionText = $('#apcontents h1').eq(1).text().trim();
        versionText = versionText.replace(/¶/g, '');  // Removing pilcrow symbol

        // Extract the version number using the regex
        const match = versionText.match(versionRegex);
        const versionNumber = match ? match[1] : "Version not found";

        return versionNumber;

    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeAzureADConnect = async () => {
    const url = 'https://learn.microsoft.com/en-us/azure/active-directory/hybrid/connect/reference-connect-version-history';
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const versionPattern = /\d+\.\d+\.\d+\.\d+/;
        const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}: Released for download./; 

        let versionText = "Version not found";

        $('body *').each((i, elem) => {
            if (datePattern.test($(elem).text())) {
                let previousText = $(elem).prevAll().text();
                let matchedVersion = previousText.match(versionPattern);
                if (matchedVersion && matchedVersion.length > 0) {
                    versionText = matchedVersion[0];
                    return false;
                }
            }
        });

        return versionText;
    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeBind = async () => {
    const url = 'https://www.isc.org/bind/';
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let versionText = "Version not found";

        $('tbody').first().find('tr').each((index, element) => {
            // Check if any td within the tr has "Current-Stable"
            if ($(element).text().includes("Current-Stable")) {
                versionText = $(element).find('td').first().text().trim();
                return false;  // Break out of the .each loop once we've found our version
            }
        });

        return versionText;
    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeBitwarden = async () => {
    const url = 'https://bitwarden.com/help/releasenotes';
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        const releaseAnnouncements = $('#release-announcements');
        if (releaseAnnouncements.length > 0) {
            // Finding the next div that has an ID attribute.
            const nextDivWithID = releaseAnnouncements.nextAll('div[id]').first();

            if (nextDivWithID.length > 0) {
                return nextDivWithID.find('h2').first().text().trim();
            }
        }
        return "Version not found";
        
    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeCacti = async () => {
    const url = 'https://www.cacti.net/';
    try {
        const { data } = await axios.get(url, {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });
        const $ = cheerio.load(data);
        
        let versionText = $('li.nav-item a[rel="noopener"]').text().trim();
        
        // Extract just the version number from the string. 
        // If the text structure changes, you might need to adjust this regex pattern.
        const versionMatch = versionText.match(/Release (\d+\.\d+\.\d+)/);
        
        return versionMatch ? versionMatch[1] : "Version not found";
        
    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeChrony = async () => {
    const url = 'https://chrony-project.org/documentation.html';
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        let versionText = $('div.sect1 h2').first().text().trim();

        return versionText || "Version not found";
        
    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeFreeRADIUS = async () => {
    const url = 'https://freeradius.org/release_notes/';
    let browser;

    // Regular expression to match version numbers
    const versionRegex = /(\d+\.\d+\.\d+)/;

    try {
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        const versionText = await page.evaluate(() => {
            const divElement = document.querySelector('div.columns.medium-5');
            if (divElement) {
                const h4Element = divElement.querySelector('h4');
                return h4Element ? h4Element.textContent : null;
            }
            return null;
        });

        // Use the regular expression to extract only the version number
        const match = versionText.match(versionRegex);
        const versionNumber = match ? match[1] : null;

        return versionNumber || "Version not found";

    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

const scrapeGlacier = async () => {
    const url = 'https://www.synology.com/en-us/releaseNote/GlacierBackup?model=DS115j';
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        let versionText = $('div#tab_7_x_series h3').first().text().trim();

        versionText = versionText.replace('Version: ', '');

        return versionText || "Version not found";
        
    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeGAM = async () => {
    const url = 'https://github.com/GAM-team/GAM/releases';
    
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        const versionText = $('div[data-pjax="#repo-content-pjax-container"] a.Link--primary.Link').first().text().trim();

        return versionText || "Version not found";
        
    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeGAPS = async () => {
    const url = 'https://support.google.com/a/answer/3294747?hl=en';
    
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        const versionText = $('div.article-content-container h2').first().text().trim();

        return versionText || "Version not found";
        
    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeGCDS = async () => {
    const url = 'https://support.google.com/a/answer/1263028?hl=en';
    
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        const versionText = $('div.article-content-container h2').eq(1).text().trim();

        return versionText || "Version not found";
        
    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeJAMF = async () => {
    const url = 'https://learn.jamf.com/bundle/jamf-pro-release-notes-current/page/New_Features_and_Enhancements.html';

    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.goto(url, {
            waitUntil: 'networkidle2' // This waits until there are no more than 2 network connections for at least 500ms.
        });
        
        await page.waitForSelector('div.zDocsBreadcrumbs'); // Explicitly wait for the div to appear

        let versionText = await page.$eval('div.zDocsBreadcrumbs h2', el => el.textContent.trim());
        
        versionText = versionText.replace('Jamf Pro Release Notes ', '');

        return versionText || "Version not found";

    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    } finally {
        if (browser) await browser.close();
    }
};

const scrapeKatalon = async () => {
    const url = 'https://docs.katalon.com/docs/plugins-and-add-ons/katalon-recorder-extension/get-started/release-notes';

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Extract the version using the provided structure.
        const versionText = $('h1 + h2').text().trim();

        return versionText.split(' ')[0] || "Version not found"; // Split to get just the version number
        
    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeMARIADB = async () => {
    const url = 'https://mariadb.com/kb/en/release-notes/';
    
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        let versionText = $('h4').first().text().trim();

        versionText = versionText.replace(' Release Notes', '');

        return versionText || "Version not found";
        
    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeMathematica = async () => {
    const url = 'https://www.wolfram.com/mathematica/quick-revision-history/';

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Extract the version using the provided structure.
        const versionText = $('section.section-wrapper .title').first().text().trim();

        return versionText || "Version not found";
        
    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeMicrosoft365 = async () => {
    const url = 'https://learn.microsoft.com/en-us/officeupdates/update-history-microsoft365-apps-by-date';

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Extract the version using the provided structure.
        const versionText = $('tbody > tr').first().children('td').eq(1).text().trim();

        return versionText || "Version not found";
        
    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const scrapeMySQL = async () => {
    const url = 'https://dev.mysql.com/doc/relnotes/mysql/8.0/en/';
    
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36');
    await page.goto(url);

    const versionText = await page.evaluate(() => {
        // Using the DOM to replicate the functionality you provided with Cheerio
        const listItems = Array.from(document.querySelectorAll('nav.doctoc li'));

        for (const item of listItems) {
            const text = item.textContent;

            if (text.includes('General Availability') && !text.includes('Not yet released')) {
                // Extract the version from the list item text
                let versionText = text.trim();

                // Remove "Changes in" and everything from the comma onward
                versionText = versionText.replace('Changes in ', '').split(' (')[0];

                return versionText;
            }
        }

        return "Version not found";
    });

    await browser.close();
    return versionText;
};

const scrapePostfix = async () => {
    const url = 'https://www.postfix.org/announcements.html';

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Extracting the version from the anchor tag inside the first list item of the unordered list in "main" div
        const versionTextRaw = $('div#main ul li:first-of-type a').first().text().trim();
        
        // Extracting the actual version using a regex. This will pull out the "3.8.1" from the raw text.
        const versionMatch = versionTextRaw.match(/Postfix stable release (\d+\.\d+\.\d+)/);

        const version = versionMatch ? versionMatch[1] : "Version not found";

        return version;

    } catch (error) {
        console.error(`Error scraping ${url}: `, error.message);
        return "Error fetching version";
    }
};

const performScrapingTask = async () => {
    updateVersion('https://tomcat.apache.org/', await scrapeTomcat());
    updateVersion('https://httpd.apache.org/',  await scrapeHttpd());
    updateVersion('https://learn.microsoft.com/en-us/azure/active-directory/hybrid/connect/reference-connect-version-history', await scrapeAzureADConnect());
    updateVersion('https://www.isc.org/bind/', await scrapeBind());
    updateVersion('https://bitwarden.com/help/releasenotes', await scrapeBitwarden());
    updateVersion('https://www.cacti.net/', await scrapeCacti());
    updateVersion('https://chrony-project.org/documentation.html', await scrapeChrony());
    updateVersion('https://freeradius.org/release_notes/', await scrapeFreeRADIUS());
    updateVersion('https://www.synology.com/en-us/releaseNote/GlacierBackup?model=DS115j', await scrapeGlacier());
    updateVersion('https://github.com/GAM-team/GAM/releases', await scrapeGAM());
    updateVersion('https://support.google.com/a/answer/3294747?hl=en', await scrapeGAPS());
    updateVersion('https://support.google.com/a/answer/1263028?hl=en', await scrapeGCDS());
    updateVersion('https://learn.jamf.com/bundle/jamf-pro-release-notes-current/page/New_Features_and_Enhancements.html', await scrapeJAMF());
    updateVersion('https://docs.katalon.com/docs/plugins-and-add-ons/katalon-recorder-extension/get-started/release-notes', await scrapeKatalon());
    updateVersion('https://mariadb.com/kb/en/release-notes/', await scrapeMARIADB());
    updateVersion('https://www.wolfram.com/mathematica/quick-revision-history/', await scrapeMathematica());
    updateVersion('https://learn.microsoft.com/en-us/officeupdates/update-history-microsoft365-apps-by-date', await scrapeMicrosoft365());
    updateVersion('https://dev.mysql.com/doc/relnotes/mysql/8.0/en/', await scrapeMySQL());
    updateVersion('https://www.postfix.org/announcements.html', await scrapePostfix());

    console.log(`Updated versions:`, websiteVersions);
    saveVersionsToFile(websiteVersions);
};

// Scheduled task to update versions every 5 seconds (for testing)
cron.schedule('0 0,12 * * *', async () => {
    updateVersion('https://tomcat.apache.org/', await scrapeTomcat());
    updateVersion('https://httpd.apache.org/',  await scrapeHttpd());
    updateVersion('https://learn.microsoft.com/en-us/azure/active-directory/hybrid/connect/reference-connect-version-history', await scrapeAzureADConnect());
    updateVersion('https://www.isc.org/bind/', await scrapeBind());
    updateVersion('https://bitwarden.com/help/releasenotes', await scrapeBitwarden());
    updateVersion('https://www.cacti.net/', await scrapeCacti());
    updateVersion('https://chrony-project.org/documentation.html', await scrapeChrony());
    updateVersion('https://freeradius.org/release_notes/', await scrapeFreeRADIUS());
    updateVersion('https://www.synology.com/en-us/releaseNote/GlacierBackup?model=DS115j', await scrapeGlacier());
    updateVersion('https://github.com/GAM-team/GAM/releases', await scrapeGAM());
    updateVersion('https://support.google.com/a/answer/3294747?hl=en', await scrapeGAPS());
    updateVersion('https://support.google.com/a/answer/1263028?hl=en', await scrapeGCDS());
    updateVersion('https://learn.jamf.com/bundle/jamf-pro-release-notes-current/page/New_Features_and_Enhancements.html', await scrapeJAMF());
    updateVersion('https://docs.katalon.com/docs/plugins-and-add-ons/katalon-recorder-extension/get-started/release-notes', await scrapeKatalon());
    updateVersion('https://mariadb.com/kb/en/release-notes/', await scrapeMARIADB());
    updateVersion('https://www.wolfram.com/mathematica/quick-revision-history/', await scrapeMathematica());
    updateVersion('https://learn.microsoft.com/en-us/officeupdates/update-history-microsoft365-apps-by-date', await scrapeMicrosoft365());
    updateVersion('https://dev.mysql.com/doc/relnotes/mysql/8.0/en/', await scrapeMySQL());
    updateVersion('https://www.postfix.org/announcements.html', await scrapePostfix());

    console.log(`Updated versions:`, websiteVersions);
    saveVersionsToFile(websiteVersions);
});

app.get('/versions', (req, res) => {
    res.json(websiteVersions);
});

app.get('/SOMETHING', async (req, res) => {
    await performScrapingTask();
    res.send('Scraping task triggered successfully!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
