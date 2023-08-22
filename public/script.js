window.onload = async () => {
    try {
        const response = await fetch('/versions');
        const data = await response.json();

        // Helper function to format version strings with the appropriate styles
        const formatVersions = (url) => {
            if (data[url] && data[url].prev !== data[url].current) {
                return `<span class="previous">${data[url].prev}</span> <span style="color: green">${data[url].current}</span>`;
            }
            return data[url] && data[url].current || 'Error fetching version';
        };

        document.getElementById('tomcatVersion').innerHTML = formatVersions('https://tomcat.apache.org/');
        document.getElementById('httpdVersion').innerHTML = formatVersions('https://httpd.apache.org/');
        document.getElementById('ADVersion').innerHTML = formatVersions('https://learn.microsoft.com/en-us/azure/active-directory/hybrid/connect/reference-connect-version-history');
        document.getElementById('iscVersion').innerHTML = formatVersions('https://www.isc.org/bind/');
        document.getElementById('bitwardenVersion').innerHTML = formatVersions('https://bitwarden.com/help/releasenotes');
        document.getElementById('cactiVersion').innerHTML = formatVersions('https://www.cacti.net/');
        document.getElementById('chronyVersion').innerHTML = formatVersions('https://chrony-project.org/documentation.html');
        document.getElementById('freeradiusVersion').innerHTML = formatVersions('https://freeradius.org/release_notes/');
        document.getElementById('synologyVersion').innerHTML = formatVersions('https://www.synology.com/en-us/releaseNote/GlacierBackup?model=DS115j');
        document.getElementById('gamVersion').innerHTML = formatVersions('https://github.com/GAM-team/GAM/releases');
        document.getElementById('google1Version').innerHTML = formatVersions('https://support.google.com/a/answer/3294747?hl=en');
        document.getElementById('google2Version').innerHTML = formatVersions('https://support.google.com/a/answer/1263028?hl=en');
        document.getElementById('jamfVersion').innerHTML = formatVersions('https://learn.jamf.com/bundle/jamf-pro-release-notes-current/page/New_Features_and_Enhancements.html');
        document.getElementById('katalonVersion').innerHTML = formatVersions('https://docs.katalon.com/docs/plugins-and-add-ons/katalon-recorder-extension/get-started/release-notes');
        document.getElementById('mariadbVersion').innerHTML = formatVersions('https://mariadb.com/kb/en/release-notes/');
        document.getElementById('mathematicaVersion').innerHTML = formatVersions('https://www.wolfram.com/mathematica/quick-revision-history/');
        document.getElementById('microsoftVersion').innerHTML = formatVersions('https://learn.microsoft.com/en-us/officeupdates/update-history-microsoft365-apps-by-date');
        document.getElementById('mysqlVersion').innerHTML = formatVersions('https://dev.mysql.com/doc/relnotes/mysql/8.0/en/');
        document.getElementById('postfixVersion').innerHTML = formatVersions('https://www.postfix.org/announcements.html');
        
    } catch (error) {
        console.error('Error fetching versions:', error);
    }
};
