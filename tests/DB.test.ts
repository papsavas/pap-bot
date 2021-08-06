import { getTableNames } from "../src/DB/GenericCRUD";
import { table_names } from "../values/generic/DB.json";

describe('Database Tables', () => {
    test('tables names matching', async () => {
        getTableNames().then(names =>
            expect(names).toBe(table_names));
    })

})
