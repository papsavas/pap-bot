import { studentEmailregex } from "../../src/tools/regexs";

describe("Student", () => {
    test("email", () => {
        expect("dai18001@uom.edu.gr").toMatch(studentEmailregex);
        expect("dai180000@uom.edu.gr").not.toMatch(studentEmailregex);
        expect("dai1801@uom.edu.gr").not.toMatch(studentEmailregex);
    })
})
