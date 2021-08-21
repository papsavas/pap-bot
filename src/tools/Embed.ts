import { EmbedFieldData, Message, MessageEmbed, MessageEmbedOptions } from "discord.js";

export function paginationEmbed(
    userMessage: Message, targetStructure: string[], perPage: number,
    headerEmbed: MessageEmbed, fieldBuilder: (resp: string, index: number, start: number) => string[],
    timeout: number, targetChannel = userMessage.channel
): Promise<void | Error> {
    if (perPage > 25) perPage = 25;

    const generateEmbed = start => {
        /**
         * @param {number} start The index to start from.
         */
        const embed = new MessageEmbed(headerEmbed);
        const current = targetStructure.slice(start, start + perPage);
        const descr = headerEmbed.description ? headerEmbed.description : '';
        embed.setDescription(descr + `\n\n**(__${start / perPage + 1}__/${Math.ceil(targetStructure.length / perPage)})**`);
        current.forEach((resp, index) => {
            const fieldArr = fieldBuilder(resp.substring(0, 1023), index, start);
            embed.addField(fieldArr[0], fieldArr[1]);
        });
        return embed
    }

    return userMessage.reply({ embeds: [generateEmbed(0)] })
        .then(message => {
            if (targetStructure.length <= perPage) return
            // react with the right arrow (so that the user can click it) (left arrow isn't needed because it is the start)
            message.react('⬅️').then(r => message.react('➡️'));
            const collector = message.createReactionCollector(
                // only collect left and right arrow reactions from the message author

                {
                    filter: (reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === userMessage.author.id,
                    time: timeout
                });

            let currentIndex = 0;
            collector.on('collect', async reaction => {
                if (reaction.emoji.name === '⬅️' && currentIndex === 0) return
                if (reaction.emoji.name === '➡️' && currentIndex + perPage >= targetStructure.length) return
                // remove the existing reactions
                // message.reactions.removeAll().then(async () => {
                // increase/decrease index
                reaction.emoji.name === '⬅️' ? currentIndex -= perPage : currentIndex += perPage
                // edit message with new embed
                await message.edit({ embeds: [generateEmbed(currentIndex)] })
                // react with left arrow if it isn't the start (await is used so that the right arrow always goes after the left)
                if (currentIndex !== 0) await message.react('⬅️');
                // react with right arrow if it isn't the end
                if (currentIndex + perPage < targetStructure.length) await message.react('➡️');
                // })
            })
        }
        ).catch(err => new Error(err));
}


export function sliceToEmbeds({ data, headerEmbed, size = 20 }: {
    //TODO: fix field overflow
    data: EmbedFieldData[],
    headerEmbed: MessageEmbedOptions,
    size?: number;
}): MessageEmbed[] {
    if (size > 20) throw new Error("embed fields are 20 max");
    const embeds = [new MessageEmbed(headerEmbed)];
    for (let i = 0; i < data.length; i += size) {
        if (i >= size * 9) return embeds;
        embeds.push(new MessageEmbed().addFields(data.slice(i, i + size)));
    }
    return embeds;
}