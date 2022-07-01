import moment from "moment";
import * as kepInfo from "../../../values/KEP/info.json";
import { CourseEvent } from "../../Entities/KEP/Course";
import { fetchSheet, SheetResponse } from "../../tools/Google/GSheets";
const { exams: examSheetURL } = kepInfo;
export { fetchCourseEvents };

//TODO: add cell url

function fetchCourseEvents(sheetName: string, spreadSheetURL?: string) {
    const resolveID = (s: string) => s?.split("/")?.pop();
    const spreadsheetId = resolveID(spreadSheetURL) ?? resolveID(examSheetURL);
    return fetchSheet(
        {
            spreadsheetId,
            range: sheetName
        },
        {
            spreadsheetId,
            ranges: [sheetName]
        }
    )
        .then(parseData);
}

function parseData(res: SheetResponse): CourseEvent[] {
    const values = res.values.data.values;
    const spreadsheet = res.spreadsheet?.data;
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
            url: `https://docs.google.com/spreadsheets/d/${spreadsheet.spreadsheetId}/edit#gid=${spreadsheet.sheets[0].properties.sheetId}&range=B${i + 1}`
        }
        retArr.push(formatted);
    }
    return retArr;
}
