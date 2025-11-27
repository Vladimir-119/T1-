export type TestCase = {
    input: string;
    expected?: string;
};

export type Task = {
    title: string;
    description: string;
    initial_code: string;
    test_cases: TestCase[];
};
