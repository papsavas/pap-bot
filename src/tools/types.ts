type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]

type RequireAtLeastOne<T> = { [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>; }[keyof T]

//TODO: RequireAtLeastOneOf<T,Keys>

type FromValues<T> = T[keyof T]

type Only<T, U> = {
    [P in keyof T]: T[P];
} & {
        [P in keyof U]?: never;
    };

type Either<T, U> = Only<T, U> | Only<U, T>;

export { AtLeast, AtLeastOne, RequireAtLeastOne, FromValues, Either };

