import {ArgsOf, Client, Discord, On} from "discordx";
import {FlagManager} from "../model/manager/FlagManager";
import {injectable} from "tsyringe";
import {ObjectUtil} from "../utils/Utils";

@Discord()
@injectable()
export class FlagReaction {

    public constructor(private _flagManager: FlagManager) {
    }

    @On("messageReactionRemove")
    private async messageReactionRemove([reaction, user]: ArgsOf<"messageReactionRemove">, client: Client): Promise<void> {
        const messageOgPoser = reaction.message.member;
        const guildMember = await reaction.message.guild.members.fetch({
            force: true,
            user: user.id
        });
        if (messageOgPoser.id !== guildMember.guild.me.id) {
            return;
        }
        const emoji = reaction.emoji;
        const flagEmoji = emoji.name;
        const role = await this._flagManager.getRoleFromAlpha2Code(flagEmoji, guildMember.guild.id, false);
        if (role) {
            guildMember.roles.remove(role);
        }
    }

    @On("messageReactionAdd")
    private async messageReactionAdd([reaction, user]: ArgsOf<"messageReactionAdd">, client: Client): Promise<void> {
        const messageOgPoser = reaction.message.member;
        const emoji = reaction.emoji;
        const flagEmoji = emoji.name;
        if (!ObjectUtil.validString(flagEmoji)) {
            return;
        }
        const guildMember = await reaction.message.guild.members.fetch({
            force: true,
            user: user.id
        });
        if (messageOgPoser.id !== guildMember.guild.me.id) {
            return;
        }
        const guildId = guildMember.guild.id;
        const role = await this._flagManager.getRoleFromAlpha2Code(flagEmoji, guildId, true);
        if (!role) {
            return;
        }
        guildMember.roles.add(role);
    }

}