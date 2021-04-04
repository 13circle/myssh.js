import commandLineArgs from "command-line-args";
import consola from "consola";
import Joi from "joi";

import cmd from "./cmd";

function parseArgs() {
  const mainCmd = [
    {
      name: "command",
      defaultOption: true,
    },
  ];
  const mainOpts = commandLineArgs(
    mainCmd,
    { stopAtFirstUnknown: true }
  );

  let argv = mainOpts._unknown || [];
  const argvConfig = {
    argv,
    stopAtFirstUnknown: true,
  };

  const { command } = mainOpts;
  let retOpts = {};

  const configName = {
    name: "configName",
    defaultOption: true,
  };
  const configCmd = [
    {
      name: "set-username",
      alias: "u",
      type: Boolean,
    },
    {
      name: "username",
      defaultOption: true,
    },
    {
      name: "set-host",
      alias: "h",
      type: Boolean,
    },
    {
      name: "hostname",
      defaultOption: true,
    },
    {
      name: "set-port",
      alias: "p",
      type: Boolean,
    },
    {
      name: "port",
      defaultOption: true,
    },
  ];

  if (command === "help") {
    //
  } else if (command === "connect") {
    retOpts = commandLineArgs(
      [
        configName,
        {
          name: "use-password",
          alias: "P",
          type: Boolean,
        },
      ],
      argvConfig
    );
  } else if (command === "list") {
    retOpts = commandLineArgs(
      [
        {
          name: "all",
          alias: "a",
          type: Boolean,
        }
      ],
      argvConfig
    );
  } else if (command === "add") {
    const addOpts = commandLineArgs(
      [configName],
      argvConfig
    );

    retOpts = addOpts;

    let isInfoPassed = true;
    for (let i = 0; i < configCmd.length - 1; i++) {
      let cmd = configCmd[i];

      if (
        cmd.alias &&
        argv.indexOf("--" + cmd.name) < 0 && 
        argv.indexOf("-" + cmd.alias) < 0
      ) {
        consola.info(cmd.name, cmd.alias);
        isInfoPassed = false;
        break;
      }
    }

    if (isInfoPassed) {
      let configOpts = {}, tempOpts = {};
      const tempCmd = [];

      argvConfig.argv = addOpts._unknown || [];

      configCmd.forEach((cmd) => {
        tempCmd.push(cmd);

        if (tempCmd.length % 2 === 0) {
          tempOpts = commandLineArgs(tempCmd, argvConfig);

          configOpts = {
            ...configOpts,
            ...tempOpts,
          };

          argvConfig.argv = tempOpts._unknown || [];
          tempCmd.length = 0;
        }
      });

      retOpts = {
        ...retOpts,
        ...configOpts,
      };
    }
  } else if (command === "remove") {
    retOpts = commandLineArgs(
      [configName],
      argvConfig
    );
  } else if (command === "edit") {
    const editOpts = commandLineArgs(
      [configName],
      argvConfig
    );

    retOpts = editOpts;

    let configOpts = {}, tempOpts = {};
    const tempCmd = [];

    argvConfig.argv = editOpts._unknown || [];

    configCmd.forEach((cmd) => {
      tempCmd.push(cmd);

      if (tempCmd.length % 2 === 0) {
        tempOpts = commandLineArgs(tempCmd, argvConfig);

        configOpts = {
          ...configOpts,
          ...tempOpts,
        };

        argvConfig.argv = tempOpts._unknown || [];
        tempCmd.length = 0;
      }
    });

    retOpts = {
      ...retOpts,
      ...configOpts,
    };
  } else {
    return {
      command: null,
    };
  }

  if (retOpts.hasOwnProperty("_unknown")) {
    delete retOpts._unknown;

    for (let key in retOpts) {
      if (key.indexOf("set-") >= 0) {
        delete retOpts[key];
      }
    }
  }
  retOpts["command"] = command || null;

  return retOpts;
}

function validate(options) {
  const { command } = options;
  
  if (!command) {
    consola.error("<Argument Error>", "no command or arguments");
    return false;
  }

  if (command.search(/^add$|^edit$/) >= 0) {
    const joiRes = Joi.object().keys({
      username: Joi.string(),
      hostname: Joi.string().regex(
        /^((\*)|((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|((\*\.)?([a-zA-Z0-9-]+\.){0,5}[a-zA-Z0-9-][a-zA-Z0-9-]+\.[a-zA-Z]{2,63}?))$/
      ),
      port: Joi.number(),
    }).unknown(true).validate(options);

    if (joiRes.error) {
      consola.error(
        "<Validation Error>",
        "Wrong input format:\n",
        joiRes.error
      );

      return false;
    }
  }

  return true;
}

export function cli() {
  const options = parseArgs();
  const { command } = options;

  if (!validate(options)) {
    process.exit(-1);
  }

  (cmd[command])(options);
};

