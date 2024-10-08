import "reflect-metadata";
import * as dotenv from "dotenv";
import { Client, ClientOptions, DIService, tsyringeDependencyRegistryEngine } from "discordx";
import { container } from "tsyringe";
import { registerInstance } from "./DI/moduleRegistrar.js";
import { dirname, importx } from "@discordx/importer";
import { IntentsBitField } from "discord.js";
import { dataSource } from "./db/DataSource.js";

dotenv.config();

export class Main {
    public static async start(): Promise<void> {
        DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);

        const connectedDs = await dataSource.initialize();
        if (!connectedDs.isInitialized) {
            throw new Error("Unable to initialise database");
        }
        const clientOps: ClientOptions = {
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMessageReactions,
                IntentsBitField.Flags.GuildPresences,
                IntentsBitField.Flags.GuildMembers,
                IntentsBitField.Flags.GuildMessages,
            ],
            silent: false,
        };

        const client = new Client(clientOps);
        registerInstance(connectedDs, client);
        await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);
        await client.login(process.env.TOKEN as string);
    }
}

await Main.start();
