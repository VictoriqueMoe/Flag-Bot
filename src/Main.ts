import "reflect-metadata";
import * as dotenv from "dotenv";
import {container} from "tsyringe";
import {Client, DIService, SimpleCommandMessage} from "discordx";
import {createConnection, useContainer} from "typeorm";
import {Intents} from "discord.js";
import {importx} from "@discordx/importer";
import {moduleRegistrar, registerInstance} from "./DI/moduleRegistrar";

dotenv.config({path: __dirname + '/../.env'});

export class Main {
    public static async start(): Promise<void> {
        DIService.container = container;
        await moduleRegistrar();
        useContainer(
            {get: someClass => container.resolve(someClass as any)},
        );
        const connection = await createConnection({
            type: "better-sqlite3",
            database: "database.sqlite",
            synchronize: true,
            key: process.env.sqlIte_key,
            entities: [__dirname + '/model/DB/**/*.model.{ts,js}'],
        });
        const client = new Client({
            simpleCommand: {
                prefix: "!",
                responses: {
                    unauthorised: (command: SimpleCommandMessage): void => {
                        console.log(command);
                    }
                }
            },
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_BANS,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_PRESENCES,
                Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_VOICE_STATES
            ],
            botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
            silent: false
        });
        registerInstance(connection, client);
        await importx(`${__dirname}/{commands,events}/**/*.{ts,js}`);
        await client.login(process.env.token);
    }
}

((async (): Promise<void> => {
    await Main.start();
})());