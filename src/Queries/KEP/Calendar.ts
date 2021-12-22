import { GaxiosResponse } from "gaxios";
import { sheets_v4 } from "googleapis";
import moment from "moment";
import { exams as examSheetURL } from "../../../values/KEP/info.json";
import { CourseEvent } from "../../Entities/KEP/Course";
import { fetchSheet } from "../../tools/Google/GSheets";
export { fetchCourseEvents };

function fetchCourseEvents(sheetName: string, spreadSheetURL?: string) {
    const resolveID = (s: string) => s?.split("/")?.pop();
    return fetchSheet({
        spreadsheetId: resolveID(spreadSheetURL) ?? resolveID(examSheetURL),
        range: sheetName
    })
        .then(parseData);
}

function parseData(res: GaxiosResponse<sheets_v4.Schema$ValueRange>): CourseEvent[] {
    const values = res.data.values;
    const retArr = [];
    for (let i = 1; i < values.length; i++) {
        const title = (values[i][1] as string)?.split("(");
        if (!title || values[i][3].length < 5) { //non existent course or date
            continue;
        }
        const name = title[0];
        const [code, ...rest] = title[1].split(')');

        const formatted: CourseEvent = {
            code: code.trim(),
            title: name.trim(),
            info: rest.shift()
                .replace("\n", "")
                .replace(",", " ")
                .replace("\t", "")
                .trim(),
            start: moment(values[i][2], "dddd, DD MMMM YYYY", "el")
                .set({ hour: moment(values[i][3], "HH:mm").hour() }).toDate(),
            end: moment(values[i][2], "dddd, DD MMMM YYYY", "el")
                .set({ hour: moment(values[i][4], "HH:mm").hour() }).toDate(),
        }
        retArr.push(formatted);
    }
    return retArr;
}
