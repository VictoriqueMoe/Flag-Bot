import "reflect-metadata";
import * as dotenv from "dotenv";
import {Client, ClientOptions, DIService, tsyringeDependencyRegistryEngine} from "discordx";
import {container} from "tsyringe";
import {registerInstance} from "./DI/moduleRegistrar.js";
import {DataSource} from "typeorm";
import {dirname, importx} from "@discordx/importer";
import {IntentsBitField} from "discord.js";

dotenv.config();

export class Main {
    public static async start(): Promise<void> {
        DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);
        const datasource = new DataSource({
            type: "better-sqlite3",
            database: "database.sqlite",
            synchronize: true,
            entities: [`${dirname(import.meta.url)}/model/DB/**/*.model.{ts,js}`]
        });

        const connectedDs = await datasource.initialize();
        if (!connectedDs.isInitialized) {
            throw new Error("Unable to initialise database");
        }
        const clientOps: ClientOptions = {
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMessageReactions,
                IntentsBitField.Flags.GuildPresences
            ],
            silent: false,
        };


        const client = new Client(clientOps);
        registerInstance(connectedDs, client);
        await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);
        await client.login(process.env.TOKEN);
    }
}

await Main.start();
