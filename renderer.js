const { BrowserWindow, app } = require('electron').remote;
const rustBridge = require('a-s-neon/native')
console.log('rust', rustBridge)
var Tabulator = require('tabulator-tables');

function modifyText () {
  // Your GitHub Applications Credentials
  var options = {
    client_id: 'e7ce535d93522896',
    scopes: "https://identity.mozilla.com/apps/oldsync profile"
  };

// Build the OAuth consent page URL
  var authWindow = new BrowserWindow({ width: 800, height: 600, show: false, webPreferences: { webSecurity: false }});
  const handle = rustBridge.fxaNew();
  const url = rustBridge.fxaBeginOAuthFlow(handle);
  console.log(url)
  var githubUrl = 'https://accounts.firefox.com/authorization?';
  //var authUrl = githubUrl + 'client_id=' + options.client_id + '&scope=' + options.scopes + '&state=bobo';
  var authUrl = url;
  authWindow.loadURL(authUrl);
  authWindow.show();

  function handleCallback (url) {
    var raw_code = /code=([^&]*)/.exec(url) || null;
    var code = (raw_code && raw_code.length > 1) ? raw_code[1] : null;

    var raw_state = /state=([^&]*)/.exec(url) || null;
    var state = (raw_state && raw_state.length > 1) ? raw_state[1] : null;

    var error = /\?error=(.+)$/.exec(url);

    if (code || error) {
      console.log('code, state', code, state)
      authWindow.destroy();
      const appPath = app.getAppPath();
      // Close the browser if code found or error
      rustBridge.fxaCompleteOAuthFlow(handle, code, state);
      const accessToken = rustBridge.fxaGetAccessToken(handle, 'https://identity.mozilla.com/apps/oldsync');
      const parsedAccessToken = JSON.parse(accessToken);
      const kid = parsedAccessToken.key.kid;
      const token = parsedAccessToken.token;
      const syncKey = parsedAccessToken.key.k;
      const loginsHandle = rustBridge.loginsNew(appPath + '/bobo.db');
      rustBridge.loginsSync(loginsHandle, kid, token, syncKey);
      const loginsList = rustBridge.loginsList(loginsHandle);
      var customMutator = function(value, data, type, params, component){

        return new Date(value); //return the new value for the cell data.
      }

      var table = new Tabulator("#login-list", {
        // height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        data: JSON.parse(loginsList), //assign data to table
        layout:"fitColumns", //fit columns to width of table (optional)
        columns:[ //Define Table Columns
          {title:"Hostname", field:"hostname", width: 200},
          {title:"Username", field:"username", width: 200},
          {title:"Password", field:"password", visible: true, clipboard:true, width: 200},
          {title:"Created", field:"timeCreated", sorter:"date", align:"center", mutator:customMutator},
        ],
        rowClick:function(e, row){ //trigger an alert message when the row is clicked
          alert("Password for " + row.getData().hostname + " copied.");
        },
      });
    }

    // If there is a code, proceed to get token from github
    if (code) {
      //alert(code);
      //self.requestGithubToken(options, code);
    } else if (error) {
      alert('Oops! Something went wrong and we couldn\'t' +
        'log you in using Github. Please try again.');
    }
  }

// Handle the response from GitHub - See Update from 4/12/2015

  authWindow.webContents.on('will-navigate', function (event, url) {
    handleCallback(url);
  });

  authWindow.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl) {
    handleCallback(newUrl);
  });

// Reset the authWindow on close
  authWindow.on('close', function() {
    authWindow = null;
  }, false);
}

var el = document.getElementById('fxaccounts-enable-button');
el.addEventListener('click', modifyText, false);