const { BrowserWindow } = require('electron').remote;


function modifyText () {
  // Your GitHub Applications Credentials
  var options = {
    client_id: 'e7ce535d93522896',
    scopes: "https://identity.mozilla.com/apps/oldsync profile"
  };

// Build the OAuth consent page URL
  var authWindow = new BrowserWindow({ width: 800, height: 600, show: false, 'node-integration': false, webSecurity: false,
    'web-preferences': {
      'web-security': false
    }
  });
  var githubUrl = 'https://accounts.firefox.com/authorization?';
  var authUrl = githubUrl + 'client_id=' + options.client_id + '&scope=' + options.scopes + '&state=bobo';
  authWindow.loadURL(authUrl);
  authWindow.show();

  function handleCallback (url) {
    var raw_code = /code=([^&]*)/.exec(url) || null;
    var code = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
    var error = /\?error=(.+)$/.exec(url);

    if (code || error) {
      // Close the browser if code found or error
      authWindow.destroy();
    }

    // If there is a code, proceed to get token from github
    if (code) {
      alert(code);
      //self.requestGithubToken(options, code);
    } else if (error) {
      alert('Oops! Something went wrong and we couldn\'t' +
        'log you in using Github. Please try again.');
    }
  }

// Handle the response from GitHub - See Update from 4/12/2015

  authWindow.webContents.on('will-navigate', function (event, url) {
    debugger
    handleCallback(url);
  });

  authWindow.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl) {
    debugger
    handleCallback(newUrl);
  });

// Reset the authWindow on close
  authWindow.on('close', function() {
    authWindow = null;
  }, false);
}

var el = document.getElementById('fxaccounts-enable-button');
el.addEventListener('click', modifyText, false);