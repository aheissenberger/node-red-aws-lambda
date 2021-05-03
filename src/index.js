import RED from 'node-red'

let headless = process.env?.HEADLESS === "true";
let reloadFlow = process.env?.RELOAD_FLOW === "true";
headless = true

let settings = {
  disableEditor: true,
  httpAdminRoot: false,
  httpNodeRoot: '/',
  // httpStatic: 'public',
  awsRegion: process.env.AWS_REGION,
  awsS3Bucket: process.env.S3_BUCKET,
  awsS3Appname: process.env.AWS_LAMBDA_FUNCTION_NAME,
  storageModule: require("./s3storage"),
  functionGlobalContext: {},
  credentialSecret: process.env.NODE_RED_SECRET || "SKEY",
  // userDir: '/Users/ah/SVN-Checkouts/TST/node-red-aws-lambda/REDuserDir/', 
  // userDir:"./REDuserDir/",
  // nodesDir: "./REDnodesDir/",
  flowFile: 'flow.json',
  logging: {
    // Only console logging is currently supported
    console: {
      // Level of logging to be recorded. Options are:
      // fatal - only those errors which make the application unusable should be recorded
      // error - record errors which are deemed fatal for a particular request + fatal errors
      // warn - record problems which are non fatal + errors + fatal errors
      // info - record information about the general running of the application + warn + error + fatal errors
      // debug - record information which is more verbose than info + info + warn + error + fatal errors
      // trace - record very detailed logging + debug + info + warn + error + fatal errors
      // off - turn off all logging (doesn't affect metrics or audit)
      level: "debug",
      // Whether or not to include metric events in the log output
      metrics: false,
      // Whether or not to include audit events in the log output
      audit: false
    }
  },
};

if (!settings.awsS3Bucket) {
  settings.userDir='/Users/ah/SVN-Checkouts/TST/node-red-aws-lambda/REDuserDir/'
}

//console.log(settings)

if (headless) {
  settings.httpRoot = false;
  settings.httpAdminRoot = false;
  settings.httpNodeRoot = false;
}

let init = (() => {
  if (headless) {
    RED.init(settings)
  } else {
    RED.init(server, settings)
    //app.use(settings.httpAdminRoot,RED.httpAdmin);
    app.use(settings.httpNodeRoot, RED.httpNode);
  }
  return new Promise((resolve, reject) => {
    let deployed;
    RED.events.on("flows:started", deployed = function (data) {

      RED.events.removeListener("flows:started", deployed);
      console.log('flow deployed');
      resolve();

    })
    RED.start();
  });
})()

function setup() {
  return init.then(() => {
    return new Promise((resolve, reject) => {
      if (reloadFlow) {
        RED.nodes.loadFlows().then(() => { resolve() });
      } else {
        resolve();
      }
    });
  });
}

const onceSetup = setup()

export async function handler(event, context) {
  await onceSetup
  const result = new Promise((resolve, reject) => {
    if (headless) {
      let handlers = {};
      function clearHandlers() {
        for (var key in handlers) RED.events.removeListener(key, handlers[key]);
      }
      function setHandlers() {
        for (var key in handlers) RED.events.once(key, handlers[key]);
      }
      handlers['aws:lambda:done:' + context.awsRequestId] = function (msg) {
        clearHandlers(); resolve({
          statusCode: 200,
          body: JSON.stringify(msg)
        })
      };
      handlers['aws:lambda:error'] = function (msg) {
        clearHandlers(); resolve({
          statusCode: 400,
          body: JSON.stringify(msg)
        })
      };
      setHandlers();
      RED.events.emit('aws:lambda:invoke', event, context)
      console.log("RED.events.emit('aws:lambda:invoke")
    } else {
      //awsServerlessExpress.proxy(server, event, context)
    }
  })
  const msg = await result
  return {
    statusCode: 200,
    body: JSON.stringify(msg)
  }
}