import {AbstractGuild} from "../AbstractGuild";
import {GenericGuild} from "../GenericGuild";
import {CategoryChannel, Channel, Client, Message, Role} from "discord.js";
import {readData} from "../../DB/firestoreRepo";
import {fetchTable} from "../../DB/dbRepo";

export class KepGuild extends AbstractGuild implements GenericGuild {
    private readonly _roles: { name: string, role: Role };
    private readonly _channels: { name: string, channel: Channel };
    private readonly _categories: { name: string, category: CategoryChannel };


    async onReady(client: Client): Promise<any> {
        await super.onReady(client);
        await this.loadIDs(client);
    }

    async onMessage(message: Message): Promise<any> {
        await super.onMessage(message);

    }

    returnResponses(): string[] {
        return Object.values(this.userResponses).flat(1)
            .concat(this.lightResponses);
    }

    private async loadIDs(client: Client): Promise<void> {

        this.channelsID = await readData('KEP/channels');
        this.categoriesID = await readData('KEP/categories');
        this.teacherUsernames = await readData('KEP/teacherUsernames', 'teachers');
        this.mutedMembers = await readData('KEP/mutedMembers');
        const rolesCache = this.guild.roles.cache;
        const channelsCache = client.channels.cache;

        async function initDiscordEntities(tableName, guildParameter, cache){
            const IDs = await fetchTable(tableName);
            for (const obj of IDs) {
                guildParameter[obj.key] = cache.get(obj.value);
            }
        }

        await initDiscordEntities('roles', this._roles, rolesCache);
        await initDiscordEntities('channels', this._channels, channelsCache);
        await initDiscordEntities('categories', this._categories, channelsCache);


            this.regist_category = channelsCache.get(this.categoriesID.registration),
            this.server_category = channelsCache.get(this.categoriesID.server),
            this.hq_category = channelsCache.get(this.categoriesID.hq),
            this.xrhsima_category = channelsCache.get(this.categoriesID.tools),
            this.etos1_category = channelsCache.get(this.categoriesID.etos1),
            this.etos2_category = channelsCache.get(this.categoriesID.etos2),
            this.etos3_category = channelsCache.get(this.categoriesID.etos3),
            this.etos4_category = channelsCache.get(this.categoriesID.etos4),
            this.etos4_2_category = channelsCache.get(this.categoriesID.etos4_2),
            this.eparkeia_category = channelsCache.get(this.categoriesID.eparkeia),
            this.sxolh_category = channelsCache.get(this.categoriesID.department),
            this.problems_category = channelsCache.get(this.categoriesID.discussion),
            this.offtopic_category = channelsCache.get(this.categoriesID.offtopic),
            this.musics_category = channelsCache.get(this.categoriesID.musics),
            this.playground_category = channelsCache.get(this.categoriesID.playground),
            this.gaming_category = channelsCache.get(this.categoriesID.gaming),

            this.pap_channel = channelsCache.get(this.channelsID.papbot),
            this.skynet_channel = channelsCache.get(this.channelsID.skynet),
            this.log_channel = channelsCache.get(this.channelsID.logs),
            this.conv_channel = channelsCache.get(this.channelsID.conv),
            this.discussion_channel = channelsCache.get(this.channelsID.discussing_subjects),
            this.commands_channel = channelsCache.get(this.channelsID.commands)
        this.anonyma_channel = channelsCache.get(this.channelsID.anonyma);
        this.anonyma_approval_channel = channelsCache.get(this.channelsID.anonyma_approval);
        this.moderation_channel = channelsCache.get(this.channelsID.moderation);
        this.memes_channel = channelsCache.get(this.channelsID.memes);
        return Promise.resolve()
    }
}