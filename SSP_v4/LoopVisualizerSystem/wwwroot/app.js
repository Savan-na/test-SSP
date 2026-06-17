let pipelineSteps = [];
let variableColorMap = {};
let isTimelineActive = false;
let currentFrameIndex = 0;
let predictionTarget = null;
let activeLessonId = "accumulator";
let activeTaskId = "sum-three";
let activeContentMode = "practice-task";
let lastLessonResult = null;
let predictionAttempts = [];
let predictionAttemptCounts = {};
let revealedPredictionKeys = new Set();
let studentActionLog = [];
let exerciseTrainingRecords = [];
let presentationMode = false;
let activeLearningMode = "mission";
let activeView = "practice";
let selectedBugLine = null;
let debugReportFeedback = null;
let reviewSelections = new Set();
let reviewFeedback = null;
let engineReady = false;
let activeWalkthroughMode = null;
let walkthroughFeedback = null;
let revealedMissionFixes = new Set();
let blankDraftValues = {};
let pendingCompletedTopicId = null;

const GUIDE_KEY = "ssp_first_run_guide_completed";
const MISSION_PROGRESS_KEY = "ssp_v11_completed_levels";
const SKILL_PROGRESS_KEY = "ssp_v11_skill_progress";
const TOPIC_BATCH_KEY = "ssp_v11_topic_batches";
const BRIGHT_PALETTE = ["#ff7b72", "#3fb950", "#d29922", "#a5d6ff", "#f274c5", "#58a6ff", "#ffc600", "#e2a6ff"];
const STUDENT_TOPIC_ORDER = ["assignment", "ifElse", "forLoop", "whileLoop", "listTraversal", "accumulator", "nestedLoop", "functionCall", "recursion", "complex"];

const LESSONS = {
    assignment: {
        title: "Variable Assignment",
        concept: "Variable assignment",
        objective: "Store and update values using variable names.",
        starterCode: `student_name = ""`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "student_name", expected: "Ada" },
            { type: "conceptSeen", concept: "Variable assignment" }
        ]
    },
    ifElse: {
        title: "If / Else",
        concept: "Condition",
        objective: "Use conditions to choose the correct branch.",
        starterCode: `score = 55

if score >= 60:
    result = "pass"
else:
    result = "retry"`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "result", expected: "pass" },
            { type: "conceptSeen", concept: "Condition" }
        ]
    },
    forLoop: {
        title: "For Loop",
        concept: "Loop",
        objective: "Use for loops to repeat work over a sequence.",
        starterCode: `last_number = 0

for number in range(1, 3):
    last_number = number`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "last_number", expected: "3" },
            { type: "conceptSeen", concept: "Loop" }
        ]
    },
    whileLoop: {
        title: "While Loop",
        concept: "Loop",
        objective: "Use while loops that stop when a condition changes.",
        starterCode: `count = 0

while count < 3:
    count += 1`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "count", expected: "5" },
            { type: "conceptSeen", concept: "Loop" }
        ]
    },
    listTraversal: {
        title: "List Traversal",
        concept: "List traversal",
        objective: "Visit list items in order and track useful information.",
        starterCode: `numbers = [2, 6, 4]
largest = 0

for number in numbers:
    largest = number`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "largest", expected: "6" },
            { type: "conceptSeen", concept: "List traversal" }
        ]
    },
    accumulator: {
        title: "Accumulator Pattern",
        concept: "Accumulator",
        objective: "Keep a running result across repeated steps.",
        starterCode: `total_sum = 0
numbers = [10, 20, 30]

for number in numbers:
    total_sum = number`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "total_sum", expected: "60" },
            { type: "conceptSeen", concept: "Accumulator" }
        ]
    },
    nestedLoop: {
        title: "Nested Loop",
        concept: "Nested loop",
        objective: "Use one loop inside another loop.",
        starterCode: `pair_count = 0
rows = ["A", "B"]
cols = [1, 2, 3]

for row in rows:
    for col in cols:
        pair_count += 0`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "pair_count", expected: "6" },
            { type: "conceptSeen", concept: "Nested loop" }
        ]
    },
    functionCall: {
        title: "Function Call",
        concept: "Function call",
        objective: "Call reusable functions and store returned values.",
        starterCode: `def square(number):
    result = number * number
    return result

answer = square(3)`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "answer", expected: "16" },
            { type: "conceptSeen", concept: "Function call" }
        ]
    },
    recursion: {
        title: "Recursion Intro",
        concept: "Recursion",
        objective: "Use a function that calls itself on a smaller problem.",
        starterCode: `def factorial(n):
    if n == 1:
        return 1
    return n * factorial(n - 1)

answer = factorial(4)`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "answer", expected: "120" },
            { type: "conceptSeen", concept: "Recursion" }
        ]
    },
    simple: {
        title: "Simple",
        concept: "Two-concept practice",
        objective: "Combine two programming ideas in one short task.",
        starterCode: `numbers = [2, 5, 8]
total = 0

for number in numbers:
    if number > 4:
        total = number`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "total", expected: "13" },
            { type: "conceptSeen", concept: "Loop" },
            { type: "conceptSeen", concept: "Condition" }
        ]
    },
    medium: {
        title: "Medium",
        concept: "Four-concept practice",
        objective: "Combine four programming ideas in a moderate task.",
        starterCode: `def discount(price):
    return price - 2

prices = [8, 12, 6]
discounted_total = 0

for price in prices:
    if price >= 8:
        discounted_total = discount(price)`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "discounted_total", expected: "24" },
            { type: "conceptSeen", concept: "List traversal" },
            { type: "conceptSeen", concept: "Condition" },
            { type: "conceptSeen", concept: "Accumulator" },
            { type: "conceptSeen", concept: "Function call" }
        ]
    },
    complex: {
        title: "Complex",
        concept: "Algorithmic practice",
        objective: "Complete longer algorithmic tasks, including fill-in-the-blank code.",
        starterCode: `numbers = [2, 4, 6, 8, 10, 12]
target = 8
left = 0
right = len(numbers) - 1
found_index = -1

while left <= right:
    mid = (left + right) // 2
    if numbers[mid] == ___1___:
        found_index = ___2___
        break
    elif numbers[mid] < target:
        left = mid + 1
    else:
        right = mid - 1`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "found_index", expected: "3" },
            { type: "conceptSeen", concept: "Loop" },
            { type: "conceptSeen", concept: "Condition" }
        ]
    }
};

const PRACTICE_TASKS = {
    assignment: [
        {
            id: "set-ada",
            title: "Set a student name",
            objective: "Set the final value of student_name to Ada.",
            starterCode: `student_name = ""`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "student_name", expected: "Ada" },
                { type: "conceptSeen", concept: "Variable assignment" }
            ]
        },
        {
            id: "update-score",
            title: "Update a score",
            objective: "Change score so its final value is 95.",
            starterCode: `score = 70
score = 80`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "score", expected: "95" },
                { type: "conceptSeen", concept: "Variable assignment" }
            ]
        },
        {
            id: "copy-display-name",
            title: "Copy a display name",
            objective: "Make display_name finish as Grace by using the existing first_name value.",
            starterCode: `first_name = "Grace"
display_name = ""`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "display_name", expected: "Grace" },
                { type: "conceptSeen", concept: "Variable assignment" }
            ]
        },
        {
            id: "calculate-total",
            title: "Calculate a total",
            objective: "Make total finish as 30.",
            starterCode: `price = 10
quantity = 3
total = 0`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "30" },
                { type: "conceptSeen", concept: "Variable assignment" }
            ]
        },
        {
            id: "undefined-variable",
            title: "Find an undefined variable",
            objective: "Run the code and identify the undefined variable error.",
            starterCode: `price = 20
total = price + tax
print(total)`,
            checks: [{ type: "errorCategory", expected: "undefined-variable" }]
        },
        {
            id: "debug-tax-total",
            title: "Debug a missing tax update",
            objective: "Fix the assignment so total finishes as 22.",
            starterCode: `price = 20
tax = 2
total = price
print(total)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "22" },
                { type: "conceptSeen", concept: "Variable assignment" }
            ]
        }
    ],
    ifElse: [
        {
            id: "pass-or-retry",
            title: "Choose pass or retry",
            objective: "Modify the code so result finishes as pass.",
            starterCode: `score = 55

if score >= 60:
    result = "pass"
else:
    result = "retry"`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "result", expected: "pass" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "discount-eligible",
            title: "Check discount eligibility",
            objective: "Make discount_status finish as eligible.",
            starterCode: `items_bought = 2

if items_bought >= 3:
    discount_status = "eligible"
else:
    discount_status = "not eligible"`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "discount_status", expected: "eligible" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "umbrella-message",
            title: "Choose an umbrella message",
            objective: "Make message finish as take umbrella.",
            starterCode: `is_raining = False

if is_raining:
    message = "take umbrella"
else:
    message = "leave umbrella"`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "message", expected: "take umbrella" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "print-result",
            title: "Trace a printed decision",
            objective: "Run the condition so stdout finishes with pass.",
            starterCode: `score = 72

if score >= 60:
    result = "pass"
else:
    result = "try again"

print(result)`,
            checks: [
                { type: "noErrors" },
                { type: "stdoutContains", text: "pass" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "boundary-score",
            title: "Fix a boundary condition",
            objective: "Make result finish as pass when score is exactly 60.",
            starterCode: `score = 60

if score > 60:
    result = "pass"
else:
    result = "retry"`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "result", expected: "pass" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        }
    ],
    forLoop: [
        {
            id: "last-number",
            title: "Track the last number",
            objective: "Use the for loop so last_number finishes as 3.",
            starterCode: `last_number = 0

for number in range(1, 3):
    last_number = number`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "last_number", expected: "3" },
                { type: "conceptSeen", concept: "Loop" }
            ]
        },
        {
            id: "loop-count",
            title: "Count loop passes",
            objective: "Make loop_count finish as 4.",
            starterCode: `loop_count = 0

for number in range(4):
    loop_count = number`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "loop_count", expected: "4" },
                { type: "conceptSeen", concept: "Loop" }
            ]
        },
        {
            id: "last-color",
            title: "Track the last color",
            objective: "Make current_color finish as blue.",
            starterCode: `colors = ["red", "green"]
current_color = ""

for color in colors:
    current_color = color`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "current_color", expected: "blue" },
                { type: "conceptSeen", concept: "Loop" }
            ]
        },
        {
            id: "range-total",
            title: "Add a small range",
            objective: "Make total finish as 10.",
            starterCode: `total = 0

for number in range(1, 5):
    total = number`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "10" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "not-iterable",
            title: "Loop over the wrong object",
            objective: "Run the code and identify why a single number cannot be looped over.",
            starterCode: `for item in 5:
    print(item)`,
            checks: [{ type: "errorCategory", expected: "not-iterable" }]
        },
        {
            id: "debug-loop-total",
            title: "Debug a loop total",
            objective: "Fix the loop so total finishes as 6.",
            starterCode: `total = 0

for number in range(1, 4):
    total = number`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "6" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        }
    ],
    whileLoop: [
        {
            id: "count-to-five",
            title: "Count to five",
            objective: "Modify the while loop so count finishes as 5.",
            starterCode: `count = 0

while count < 3:
    count += 1`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "count", expected: "5" },
                { type: "conceptSeen", concept: "Loop" }
            ]
        },
        {
            id: "fuel-down",
            title: "Drain the fuel",
            objective: "Make fuel finish as 0.",
            starterCode: `fuel = 3

while fuel > 0:
    fuel -= 2`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "fuel", expected: "0" },
                { type: "conceptSeen", concept: "Loop" }
            ]
        },
        {
            id: "reach-target",
            title: "Reach the target",
            objective: "Make current finish as 12.",
            starterCode: `current = 0

while current < 12:
    current += 5`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "current", expected: "12" },
                { type: "conceptSeen", concept: "Loop" }
            ]
        },
        {
            id: "while-total",
            title: "Accumulate with while",
            objective: "Make total finish as 10.",
            starterCode: `number = 1
total = 0

while number <= 4:
    total += number
    number += 2`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "10" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "infinite-risk",
            title: "Spot an infinite-loop risk",
            objective: "Run the code and identify why the while loop does not finish.",
            starterCode: `count = 0

while count < 3:
    print(count)`,
            checks: [{ type: "errorCategory", expected: "infinite-loop-risk" }]
        },
        {
            id: "debug-while-total",
            title: "Debug a while total",
            objective: "Fix the while loop so total finishes as 10.",
            starterCode: `number = 1
total = 0

while number <= 4:
    total = number
    number += 1`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "10" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        }
    ],
    listTraversal: [
        {
            id: "largest-value",
            title: "Trace the largest value",
            objective: "Traverse the list so largest finishes as 6.",
            starterCode: `numbers = [2, 6, 4]
largest = 0

for number in numbers:
    largest = number`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "largest", expected: "6" },
                { type: "conceptSeen", concept: "List traversal" }
            ]
        },
        {
            id: "smallest-value",
            title: "Find the smallest value",
            objective: "Make smallest finish as 2.",
            starterCode: `numbers = [4, 2, 7]
smallest = 0

for number in numbers:
    smallest = number`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "smallest", expected: "2" },
                { type: "conceptSeen", concept: "List traversal" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "count-items",
            title: "Count list items",
            objective: "Make item_count finish as 4.",
            starterCode: `items = ["pen", "book", "bag", "key"]
item_count = 0

for item in items:
    item_count = 1`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "item_count", expected: "4" },
                { type: "conceptSeen", concept: "List traversal" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "first-item",
            title: "Read the first item",
            objective: "Make first_color finish as red.",
            starterCode: `colors = ["red", "green", "blue"]
first_color = ""`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "first_color", expected: "red" },
                { type: "conceptSeen", concept: "List / sequence" }
            ]
        },
        {
            id: "sum-list",
            title: "Sum list values",
            objective: "Make total finish as 12.",
            starterCode: `numbers = [3, 4, 5]
total = 0

for number in numbers:
    total = number`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "12" },
                { type: "conceptSeen", concept: "List traversal" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        }
    ],
    accumulator: [
        {
            id: "sum-three",
            title: "Build the sum",
            objective: "Make the final total_sum equal 60.",
            starterCode: `total_sum = 0
numbers = [10, 20, 30]

for number in numbers:
    total_sum = number`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total_sum", expected: "60" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "sum-four",
            title: "Add four prices",
            objective: "Make the final total_sum equal 100.",
            starterCode: `total_sum = 0
prices = [10, 20, 30, 40]

for price in prices:
    total_sum = price`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total_sum", expected: "100" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "product-values",
            title: "Build a product",
            objective: "Make product finish as 24.",
            starterCode: `numbers = [2, 3, 4]
product = 0

for number in numbers:
    product *= number`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "product", expected: "24" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "total-length",
            title: "Accumulate word lengths",
            objective: "Make total_length finish as 9.",
            starterCode: `words = ["cat", "tree", "go"]
total_length = 0

for word in words:
    total_length = len(word)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total_length", expected: "9" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "count-positives",
            title: "Count positive numbers",
            objective: "Make positive_count finish as 3.",
            starterCode: `numbers = [-2, 5, 0, 8, 1]
positive_count = 0

for number in numbers:
    if number > 0:
        positive_count = 1`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "positive_count", expected: "3" },
                { type: "conceptSeen", concept: "Accumulator" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        }
    ],
    nestedLoop: [
        {
            id: "count-pairs",
            title: "Count row and column pairs",
            objective: "Count every row/column pair so pair_count finishes as 6.",
            starterCode: `pair_count = 0
rows = ["A", "B"]
cols = [1, 2, 3]

for row in rows:
    for col in cols:
        pair_count += 0`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "pair_count", expected: "6" },
                { type: "conceptSeen", concept: "Nested loop" }
            ]
        },
        {
            id: "grid-total",
            title: "Add grid values",
            objective: "Make grid_total finish as 21.",
            starterCode: `rows = [[1, 2, 3], [4, 5, 6]]
grid_total = 0

for row in rows:
    for value in row:
        grid_total = value`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "grid_total", expected: "21" },
                { type: "conceptSeen", concept: "Nested loop" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "label-count",
            title: "Count labels",
            objective: "Make label_count finish as 4.",
            starterCode: `letters = ["A", "B"]
numbers = [1, 2]
label_count = 0

for letter in letters:
    for number in numbers:
        label_count = 1`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "label_count", expected: "4" },
                { type: "conceptSeen", concept: "Nested loop" }
            ]
        },
        {
            id: "last-product",
            title: "Track a multiplication table",
            objective: "Make last_product finish as 6.",
            starterCode: `last_product = 0

for row in range(1, 3):
    for col in range(1, 4):
        last_product = row + col`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "last_product", expected: "6" },
                { type: "conceptSeen", concept: "Nested loop" }
            ]
        },
        {
            id: "even-grid-count",
            title: "Count even grid values",
            objective: "Make even_count finish as 3.",
            starterCode: `rows = [[1, 2], [3, 4], [5, 6]]
even_count = 0

for row in rows:
    for value in row:
        if value % 2 == 0:
            even_count = 1`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "even_count", expected: "3" },
                { type: "conceptSeen", concept: "Nested loop" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        }
    ],
    functionCall: [
        {
            id: "square-call",
            title: "Call a square function",
            objective: "Call square so answer finishes as 16.",
            starterCode: `def square(number):
    result = number * number
    return result

answer = square(3)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "answer", expected: "16" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        },
        {
            id: "double-call",
            title: "Call a double function",
            objective: "Make answer finish as 14.",
            starterCode: `def double(number):
    return number * 2

answer = double(6)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "answer", expected: "14" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        },
        {
            id: "greeting-call",
            title: "Build a greeting",
            objective: "Make message finish as Hello Ada.",
            starterCode: `def greet(name):
    return "Hello " + name

message = greet("Ava")`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "message", expected: "Hello Ada" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        },
        {
            id: "area-call",
            title: "Compute an area",
            objective: "Make area finish as 20.",
            starterCode: `def rectangle_area(width, height):
    return width + height

area = rectangle_area(4, 5)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "area", expected: "20" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        },
        {
            id: "call-twice",
            title: "Use a function twice",
            objective: "Make result finish as 25.",
            starterCode: `def add_five(number):
    return number + 5

first = add_five(10)
result = add_five(first)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "result", expected: "25" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        }
    ],
    recursion: [
        {
            id: "factorial-five",
            title: "Trace factorial",
            objective: "Use recursion so answer finishes as 120.",
            starterCode: `def factorial(n):
    if n == 1:
        return 1
    return n * factorial(n - 1)

answer = factorial(4)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "answer", expected: "120" },
                { type: "conceptSeen", concept: "Recursion" }
            ]
        },
        {
            id: "sum-to-four",
            title: "Recursive sum",
            objective: "Make answer finish as 10.",
            starterCode: `def sum_to(n):
    if n == 1:
        return 1
    return n + sum_to(n - 1)

answer = sum_to(3)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "answer", expected: "10" },
                { type: "conceptSeen", concept: "Recursion" }
            ]
        },
        {
            id: "power-two-three",
            title: "Recursive power",
            objective: "Make result finish as 8.",
            starterCode: `def power(base, exponent):
    if exponent == 0:
        return 1
    return base + power(base, exponent - 1)

result = power(2, 3)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "result", expected: "8" },
                { type: "conceptSeen", concept: "Recursion" }
            ]
        },
        {
            id: "fibonacci-five",
            title: "Recursive Fibonacci",
            objective: "Make answer finish as 5.",
            starterCode: `def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

answer = fib(4)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "answer", expected: "5" },
                { type: "conceptSeen", concept: "Recursion" }
            ]
        },
        {
            id: "recursive-countdown",
            title: "Recursive countdown",
            objective: "Make final_value finish as 0.",
            starterCode: `def countdown(n):
    if n == 0:
        return n
    return countdown(n - 1)

final_value = countdown(2)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "final_value", expected: "0" },
                { type: "conceptSeen", concept: "Recursion" }
            ]
        }
    ],
    simple: [
        {
            id: "simple-filter-total",
            title: "Filter and add",
            objective: "Use a loop and a condition so total finishes as 13.",
            concepts: ["Loop", "Condition"],
            starterCode: `numbers = [2, 5, 8]
total = 0

for number in numbers:
    if number > 4:
        total = number`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "13" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "simple-function-assignment",
            title: "Function and assignment",
            objective: "Use assignment and a function call so final_score finishes as 18.",
            concepts: ["Variable assignment", "Function call"],
            starterCode: `def add_bonus(score):
    return score + 3

base_score = 15
final_score = add_bonus(12)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "final_score", expected: "18" },
                { type: "conceptSeen", concept: "Variable assignment" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        },
        {
            id: "simple-list-count",
            title: "List and accumulator",
            objective: "Use list traversal and an accumulator so item_count finishes as 4.",
            concepts: ["List traversal", "Accumulator"],
            starterCode: `items = ["pen", "book", "bag", "key"]
item_count = 0

for item in items:
    item_count = 1`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "item_count", expected: "4" },
                { type: "conceptSeen", concept: "List traversal" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "simple-while-assignment",
            title: "While and assignment",
            objective: "Use a while loop and assignment so count finishes as 3.",
            concepts: ["Loop", "Variable assignment"],
            starterCode: `count = 0

while count < 3:
    count = 3`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "count", expected: "3" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Variable assignment" }
            ]
        },
        {
            id: "simple-recursive-call",
            title: "Function call and recursion",
            objective: "Use recursion and a function call so answer finishes as 6.",
            concepts: ["Recursion", "Function call"],
            starterCode: `def sum_to(n):
    if n == 1:
        return 1
    return n + sum_to(n - 1)

answer = sum_to(2)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "answer", expected: "6" },
                { type: "conceptSeen", concept: "Recursion" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        }
    ],
    medium: [
        {
            id: "medium-discount-total",
            title: "Discounted total",
            objective: "Use traversal, condition, accumulator, and function call so discounted_total finishes as 24.",
            concepts: ["List traversal", "Condition", "Accumulator", "Function call"],
            starterCode: `def discount(price):
    return price - 2

prices = [8, 12, 6]
discounted_total = 0

for price in prices:
    if price >= 8:
        discounted_total = discount(price)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "discounted_total", expected: "24" },
                { type: "conceptSeen", concept: "List traversal" },
                { type: "conceptSeen", concept: "Condition" },
                { type: "conceptSeen", concept: "Accumulator" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        },
        {
            id: "medium-grid-count",
            title: "Count matching grid cells",
            objective: "Use nested loops, condition, accumulator, and assignment so match_count finishes as 3.",
            concepts: ["Nested loop", "Condition", "Accumulator", "Variable assignment"],
            starterCode: `grid = [[1, 4], [6, 3], [8, 2]]
match_count = 0

for row in grid:
    for value in row:
        if value >= 4:
            match_count = 1`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "match_count", expected: "3" },
                { type: "conceptSeen", concept: "Nested loop" },
                { type: "conceptSeen", concept: "Condition" },
                { type: "conceptSeen", concept: "Accumulator" },
                { type: "conceptSeen", concept: "Variable assignment" }
            ]
        },
        {
            id: "medium-average-score",
            title: "Average passing scores",
            objective: "Use traversal, condition, accumulator, and function call so passing_total finishes as 170.",
            concepts: ["List traversal", "Condition", "Accumulator", "Function call"],
            starterCode: `def is_passing(score):
    return score >= 60

scores = [55, 80, 90]
passing_total = 0

for score in scores:
    if is_passing(score):
        passing_total = score`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "passing_total", expected: "170" },
                { type: "conceptSeen", concept: "List traversal" },
                { type: "conceptSeen", concept: "Condition" },
                { type: "conceptSeen", concept: "Accumulator" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        },
        {
            id: "medium-while-list-limit",
            title: "While through a list",
            objective: "Use while loop, list access, condition, and accumulator so total finishes as 9.",
            concepts: ["Loop", "List / sequence", "Condition", "Accumulator"],
            starterCode: `numbers = [3, 6, 10]
index = 0
total = 0

while index < len(numbers):
    if numbers[index] < 10:
        total = numbers[index]
    index += 1`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "9" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "List / sequence" },
                { type: "conceptSeen", concept: "Condition" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "medium-recursive-filter",
            title: "Recursive filtered sum",
            objective: "Use recursion, condition, accumulator-style return, and function call so answer finishes as 9.",
            concepts: ["Recursion", "Condition", "Accumulator", "Function call"],
            starterCode: `def sum_positive(values, index):
    if index == len(values):
        return 0
    if values[index] > 0:
        return values[index]
    return sum_positive(values, index + 1)

answer = sum_positive([4, -2, 5], 0)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "answer", expected: "9" },
                { type: "conceptSeen", concept: "Recursion" },
                { type: "conceptSeen", concept: "Condition" },
                { type: "conceptSeen", concept: "Accumulator" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        }
    ],
    complex: [
        {
            id: "complex-binary-search-fill",
            title: "Complete binary search",
            objective: "Fill every blank, then run the code so found_index finishes as 3.",
            taskType: "fill-blank",
            concepts: ["While loop", "Condition", "List traversal", "Algorithmic search"],
            starterCode: `numbers = [2, 4, 6, 8, 10, 12]
target = 8
left = 0
right = len(numbers) - 1
found_index = -1

while left <= right:
    mid = (left + right) // 2
    if numbers[mid] == ___1___:
        found_index = ___2___
        break
    elif numbers[mid] < target:
        left = mid + 1
    else:
        right = mid - 1`,
            blanks: [
                { token: "___1___", label: "comparison target" },
                { token: "___2___", label: "index to store when the target is found" }
            ],
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "found_index", expected: "3" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "complex-two-pointer-fill",
            title: "Complete two-pointer pair search",
            objective: "Fill every blank so pair_found finishes as True.",
            taskType: "fill-blank",
            concepts: ["While loop", "Condition", "List traversal", "Algorithmic search"],
            starterCode: `numbers = [1, 2, 4, 7, 11]
target = 9
left = 0
right = len(numbers) - 1
pair_found = False

while left < right:
    current_sum = numbers[left] + numbers[right]
    if current_sum == ___1___:
        pair_found = ___2___
        break
    elif current_sum < target:
        left += 1
    else:
        right -= 1`,
            blanks: [
                { token: "___1___", label: "target sum" },
                { token: "___2___", label: "boolean value when a pair is found" }
            ],
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "pair_found", expected: "True" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "complex-frequency-fill",
            title: "Complete a frequency counter",
            objective: "Fill every blank so count_a finishes as 3.",
            taskType: "fill-blank",
            concepts: ["Loop", "Condition", "Accumulator", "Dictionary"],
            starterCode: `letters = ["a", "b", "a", "c", "a"]
counts = {}

for letter in letters:
    if letter not in counts:
        counts[letter] = ___1___
    counts[letter] += ___2___

count_a = counts["a"]`,
            blanks: [
                { token: "___1___", label: "starting count" },
                { token: "___2___", label: "amount to add each time" }
            ],
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "count_a", expected: "3" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Condition" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "complex-dp-fill",
            title: "Complete a dynamic programming table",
            objective: "Fill every blank so ways finishes as 8.",
            taskType: "fill-blank",
            concepts: ["Loop", "List / sequence", "Accumulator", "Dynamic programming"],
            starterCode: `steps = 5
dp = [0] * (steps + 1)
dp[0] = 1
dp[1] = 1

for index in range(2, steps + 1):
    dp[index] = dp[index - ___1___] + dp[index - ___2___]

ways = dp[steps]`,
            blanks: [
                { token: "___1___", label: "previous step offset" },
                { token: "___2___", label: "two-step offset" }
            ],
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "ways", expected: "8" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "List / sequence" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "complex-write-linear-search",
            title: "Write linear search",
            objective: "Write the missing loop body so found_index finishes as 2.",
            concepts: ["Loop", "Condition", "List traversal", "Algorithmic search"],
            starterCode: `numbers = [5, 9, 12, 20]
target = 12
found_index = -1

for index in range(len(numbers)):
    # Write code here to update found_index when target is found.
    pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "found_index", expected: "2" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        }
    ]
};

const STUDENT_LEVEL_TASKS = {
    assignment: [
        {
            id: "assignment-l1-blank",
            title: "Fill the stored name",
            objective: "Replace the blank so student_name finishes as Ada.",
            taskType: "level-1-blank",
            concepts: ["Variable assignment"],
            starterCode: `student_name = ___1___`,
            blanks: [{ token: "___1___", label: "string value for the variable" }],
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "student_name", expected: "Ada" },
                { type: "conceptSeen", concept: "Variable assignment" }
            ]
        },
        {
            id: "assignment-l2-line",
            title: "Copy the existing value",
            objective: "Write one line so display_name finishes as Grace.",
            taskType: "level-2-line",
            concepts: ["Variable assignment"],
            starterCode: `first_name = "Grace"
# Write one line here to copy first_name into display_name.
pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "display_name", expected: "Grace" },
                { type: "conceptSeen", concept: "Variable assignment" }
            ]
        },
        {
            id: "assignment-l3-block",
            title: "Complete the calculation block",
            objective: "Complete the small calculation block so total finishes as 30.",
            taskType: "level-3-block",
            concepts: ["Variable assignment"],
            starterCode: `price = 10
quantity = 3

# Complete this block.
total = 0
pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "30" },
                { type: "conceptSeen", concept: "Variable assignment" }
            ]
        },
        {
            id: "assignment-l4-program",
            title: "Write a two-variable program",
            objective: "Write a short program so city finishes as Paris and country finishes as France.",
            taskType: "level-4-program",
            concepts: ["Variable assignment"],
            starterCode: `# Write the whole program below.
# Goal: city = "Paris" and country = "France"
pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "city", expected: "Paris" },
                { type: "variableEquals", variable: "country", expected: "France" },
                { type: "conceptSeen", concept: "Variable assignment" }
            ]
        },
        {
            id: "assignment-l5-debug",
            title: "Debug a missing tax update",
            objective: "Find the broken assignment and fix it so total finishes as 22.",
            taskType: "level-5-debug",
            concepts: ["Variable assignment"],
            debug: {
                line: 3,
                cause: "total stores only price, so the tax value never reaches the final total.",
                fixHint: "Use both values on the right side, such as total = price + tax."
            },
            starterCode: `price = 20
tax = 2
total = price
print(total)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "22" },
                { type: "conceptSeen", concept: "Variable assignment" }
            ]
        }
    ],
    ifElse: [
        {
            id: "ifelse-l1-blank",
            title: "Fill the condition",
            objective: "Replace the blank so result finishes as pass.",
            taskType: "level-1-blank",
            concepts: ["Condition"],
            starterCode: `score = 72

if ___1___:
    result = "pass"
else:
    result = "retry"`,
            blanks: [{ token: "___1___", label: "condition that checks the passing score" }],
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "result", expected: "pass" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "ifelse-l2-line",
            title: "Write the hot branch",
            objective: "Write one line inside the true branch so message finishes as hot.",
            taskType: "level-2-line",
            concepts: ["Condition"],
            starterCode: `temperature = 35

if temperature >= 30:
    # Write one line here.
    pass
else:
    message = "cool"`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "message", expected: "hot" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "ifelse-l3-block",
            title: "Complete the fallback block",
            objective: "Complete the else block so access finishes as yes.",
            taskType: "level-3-block",
            concepts: ["Condition"],
            starterCode: `age = 16
has_permission = True

if age >= 18:
    access = "yes"
else:
    # Complete this block.
    pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "access", expected: "yes" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "ifelse-l4-program",
            title: "Write the grade decision",
            objective: "Write an if/else program so grade finishes as A.",
            taskType: "level-4-program",
            concepts: ["Condition"],
            starterCode: `score = 88

# Write the whole if/else decision below.
pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "grade", expected: "A" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "ifelse-l5-debug",
            title: "Debug a boundary condition",
            objective: "Fix the boundary so result finishes as pass when score is exactly 60.",
            taskType: "level-5-debug",
            concepts: ["Condition"],
            debug: {
                line: 3,
                cause: "The condition uses >, so a score of exactly 60 falls into the retry branch.",
                fixHint: "Use >= when the boundary value should pass."
            },
            starterCode: `score = 60

if score > 60:
    result = "pass"
else:
    result = "retry"`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "result", expected: "pass" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        }
    ],
    forLoop: [
        {
            id: "for-l1-blank",
            title: "Fill the range stop",
            objective: "Replace the blank so last_number finishes as 3.",
            taskType: "level-1-blank",
            concepts: ["Loop"],
            starterCode: `last_number = 0

for number in range(1, ___1___):
    last_number = number`,
            blanks: [{ token: "___1___", label: "range stop value" }],
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "last_number", expected: "3" },
                { type: "conceptSeen", concept: "Loop" }
            ]
        },
        {
            id: "for-l2-line",
            title: "Count loop passes",
            objective: "Write one line inside the loop so loop_count finishes as 4.",
            taskType: "level-2-line",
            concepts: ["Loop", "Accumulator"],
            starterCode: `loop_count = 0

for number in range(4):
    # Write one line here.
    pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "loop_count", expected: "4" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "for-l3-block",
            title: "Complete the total block",
            objective: "Complete the loop block so total finishes as 10.",
            taskType: "level-3-block",
            concepts: ["Loop", "Accumulator"],
            starterCode: `total = 0

for number in range(1, 5):
    # Complete this block.
    pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "10" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "for-l4-program",
            title: "Write a color traversal",
            objective: "Write a for loop so current_color finishes as blue.",
            taskType: "level-4-program",
            concepts: ["Loop", "List traversal"],
            starterCode: `colors = ["red", "green", "blue"]
current_color = ""

# Write the whole for loop below.
pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "current_color", expected: "blue" },
                { type: "conceptSeen", concept: "Loop" }
            ]
        },
        {
            id: "for-l5-debug",
            title: "Debug a loop total",
            objective: "Find the broken update and fix the loop so total finishes as 6.",
            taskType: "level-5-debug",
            concepts: ["Loop", "Accumulator"],
            debug: {
                line: 4,
                cause: "total is overwritten with each number instead of accumulating the running total.",
                fixHint: "Replace the overwrite with an accumulator update such as total += number."
            },
            starterCode: `total = 0

for number in range(1, 4):
    total = number`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "6" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        }
    ],
    whileLoop: [
        {
            id: "while-l1-blank",
            title: "Fill the stop condition",
            objective: "Replace the blank so count finishes as 5.",
            taskType: "level-1-blank",
            concepts: ["Loop"],
            starterCode: `count = 0

while count < ___1___:
    count += 1`,
            blanks: [{ token: "___1___", label: "loop stop value" }],
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "count", expected: "5" },
                { type: "conceptSeen", concept: "Loop" }
            ]
        },
        {
            id: "while-l2-line",
            title: "Drain the fuel",
            objective: "Write one line inside the loop so fuel finishes as 0.",
            taskType: "level-2-line",
            concepts: ["Loop"],
            starterCode: `fuel = 3

while fuel > 0:
    # Write one line here.
    pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "fuel", expected: "0" },
                { type: "conceptSeen", concept: "Loop" }
            ]
        },
        {
            id: "while-l3-block",
            title: "Complete the running total",
            objective: "Complete the while block so total finishes as 10.",
            taskType: "level-3-block",
            concepts: ["Loop", "Accumulator"],
            starterCode: `number = 1
total = 0

while number <= 4:
    # Complete this block.
    pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "10" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "while-l4-program",
            title: "Write a target loop",
            objective: "Write a while loop so current finishes as 12.",
            taskType: "level-4-program",
            concepts: ["Loop"],
            starterCode: `current = 0

# Write the whole while loop below.
pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "current", expected: "12" },
                { type: "conceptSeen", concept: "Loop" }
            ]
        },
        {
            id: "while-l5-debug",
            title: "Debug a while total",
            objective: "Find the broken update and fix the while loop so total finishes as 10.",
            taskType: "level-5-debug",
            concepts: ["Loop", "Accumulator"],
            debug: {
                line: 5,
                cause: "total is assigned the current number each pass, so earlier values are lost.",
                fixHint: "Use total += number before number increases."
            },
            starterCode: `number = 1
total = 0

while number <= 4:
    total = number
    number += 1`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "10" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        }
    ],
    listTraversal: [
        {
            id: "list-l1-blank",
            title: "Fill the first index",
            objective: "Replace the blank so first_color finishes as red.",
            taskType: "level-1-blank",
            concepts: ["List / sequence"],
            starterCode: `colors = ["red", "green", "blue"]
first_color = colors[___1___]`,
            blanks: [{ token: "___1___", label: "index of the first item" }],
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "first_color", expected: "red" },
                { type: "conceptSeen", concept: "List / sequence" }
            ]
        },
        {
            id: "list-l2-line",
            title: "Update the largest value",
            objective: "Write one line so largest finishes as 6.",
            taskType: "level-2-line",
            concepts: ["List traversal", "Condition"],
            starterCode: `numbers = [2, 6, 4]
largest = 0

for number in numbers:
    if number > largest:
        # Write one line here.
        pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "largest", expected: "6" },
                { type: "conceptSeen", concept: "List traversal" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "list-l3-block",
            title: "Complete the smallest-value block",
            objective: "Complete the loop block so smallest finishes as 2.",
            taskType: "level-3-block",
            concepts: ["List traversal", "Condition"],
            starterCode: `numbers = [4, 2, 7]
smallest = numbers[0]

for number in numbers:
    # Complete this block.
    pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "smallest", expected: "2" },
                { type: "conceptSeen", concept: "List traversal" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "list-l4-program",
            title: "Write a list counter",
            objective: "Write a traversal so item_count finishes as 4.",
            taskType: "level-4-program",
            concepts: ["List traversal", "Accumulator"],
            starterCode: `items = ["pen", "book", "bag", "key"]
item_count = 0

# Write the whole traversal below.
pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "item_count", expected: "4" },
                { type: "conceptSeen", concept: "List traversal" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "list-l5-debug",
            title: "Debug a list total",
            objective: "Find the broken update and fix the traversal so total finishes as 12.",
            taskType: "level-5-debug",
            concepts: ["List traversal", "Accumulator"],
            debug: {
                line: 5,
                cause: "total is replaced by each list item instead of adding the item into the total.",
                fixHint: "Use total += number inside the loop."
            },
            starterCode: `numbers = [3, 4, 5]
total = 0

for number in numbers:
    total = number`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total", expected: "12" },
                { type: "conceptSeen", concept: "List traversal" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        }
    ],
    accumulator: [
        {
            id: "accumulator-l1-blank",
            title: "Fill the accumulator operator",
            objective: "Replace the blank so total_sum finishes as 60.",
            taskType: "level-1-blank",
            concepts: ["Accumulator"],
            starterCode: `total_sum = 0
numbers = [10, 20, 30]

for number in numbers:
    total_sum = total_sum ___1___ number`,
            blanks: [{ token: "___1___", label: "operator that adds the current number" }],
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total_sum", expected: "60" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "accumulator-l2-line",
            title: "Add prices with one line",
            objective: "Write one line inside the loop so total_sum finishes as 100.",
            taskType: "level-2-line",
            concepts: ["Accumulator"],
            starterCode: `total_sum = 0
prices = [10, 20, 30, 40]

for price in prices:
    # Write one line here.
    pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total_sum", expected: "100" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "accumulator-l3-block",
            title: "Complete the length accumulator",
            objective: "Complete the loop block so total_length finishes as 9.",
            taskType: "level-3-block",
            concepts: ["Accumulator", "List traversal"],
            starterCode: `words = ["cat", "tree", "go"]
total_length = 0

for word in words:
    # Complete this block.
    pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total_length", expected: "9" },
                { type: "conceptSeen", concept: "Accumulator" },
                { type: "conceptSeen", concept: "List traversal" }
            ]
        },
        {
            id: "accumulator-l4-program",
            title: "Write a product accumulator",
            objective: "Write a loop so product finishes as 24.",
            taskType: "level-4-program",
            concepts: ["Accumulator"],
            starterCode: `numbers = [2, 3, 4]
product = 1

# Write the whole accumulator loop below.
pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "product", expected: "24" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "accumulator-l5-debug",
            title: "Debug a positive counter",
            objective: "Find the broken update and fix the counter so positive_count finishes as 3.",
            taskType: "level-5-debug",
            concepts: ["Accumulator", "Condition"],
            debug: {
                line: 6,
                cause: "positive_count is assigned 1 for every positive number, so it never counts past one.",
                fixHint: "Use positive_count += 1 inside the if block."
            },
            starterCode: `numbers = [-2, 5, 0, 8, 1]
positive_count = 0

for number in numbers:
    if number > 0:
        positive_count = 1`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "positive_count", expected: "3" },
                { type: "conceptSeen", concept: "Accumulator" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        }
    ],
    nestedLoop: [
        {
            id: "nested-l1-blank",
            title: "Fill the pair counter update",
            objective: "Replace the blank so pair_count finishes as 6.",
            taskType: "level-1-blank",
            concepts: ["Nested loop"],
            starterCode: `pair_count = 0
rows = ["A", "B"]
cols = [1, 2, 3]

for row in rows:
    for col in cols:
        pair_count += ___1___`,
            blanks: [{ token: "___1___", label: "amount to add for each pair" }],
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "pair_count", expected: "6" },
                { type: "conceptSeen", concept: "Nested loop" }
            ]
        },
        {
            id: "nested-l2-line",
            title: "Count grid labels",
            objective: "Write one line inside the inner loop so label_count finishes as 4.",
            taskType: "level-2-line",
            concepts: ["Nested loop", "Accumulator"],
            starterCode: `letters = ["A", "B"]
numbers = [1, 2]
label_count = 0

for letter in letters:
    for number in numbers:
        # Write one line here.
        pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "label_count", expected: "4" },
                { type: "conceptSeen", concept: "Nested loop" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "nested-l3-block",
            title: "Complete the grid total block",
            objective: "Complete the nested-loop block so grid_total finishes as 21.",
            taskType: "level-3-block",
            concepts: ["Nested loop", "Accumulator"],
            starterCode: `rows = [[1, 2, 3], [4, 5, 6]]
grid_total = 0

for row in rows:
    for value in row:
        # Complete this block.
        pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "grid_total", expected: "21" },
                { type: "conceptSeen", concept: "Nested loop" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "nested-l4-program",
            title: "Write a multiplication traversal",
            objective: "Write nested loops so last_product finishes as 6.",
            taskType: "level-4-program",
            concepts: ["Nested loop"],
            starterCode: `last_product = 0

# Write the whole nested-loop program below.
pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "last_product", expected: "6" },
                { type: "conceptSeen", concept: "Nested loop" }
            ]
        },
        {
            id: "nested-l5-debug",
            title: "Debug an even-value counter",
            objective: "Find the broken counter and fix it so even_count finishes as 3.",
            taskType: "level-5-debug",
            concepts: ["Nested loop", "Condition"],
            debug: {
                line: 7,
                cause: "even_count is set to 1 for each even value, so it does not count all matches.",
                fixHint: "Use even_count += 1 inside the nested condition."
            },
            starterCode: `rows = [[1, 2], [3, 4], [5, 6]]
even_count = 0

for row in rows:
    for value in row:
        if value % 2 == 0:
            even_count = 1`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "even_count", expected: "3" },
                { type: "conceptSeen", concept: "Nested loop" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        }
    ],
    functionCall: [
        {
            id: "function-l1-blank",
            title: "Fill the function argument",
            objective: "Replace the blank so answer finishes as 16.",
            taskType: "level-1-blank",
            concepts: ["Function call"],
            starterCode: `def square(number):
    return number * number

answer = square(___1___)`,
            blanks: [{ token: "___1___", label: "argument passed into square" }],
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "answer", expected: "16" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        },
        {
            id: "function-l2-line",
            title: "Write the return line",
            objective: "Write one line inside the function so answer finishes as 14.",
            taskType: "level-2-line",
            concepts: ["Function call", "Function definition"],
            starterCode: `def double(number):
    # Write one line here.
    pass

answer = double(7)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "answer", expected: "14" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        },
        {
            id: "function-l3-block",
            title: "Complete the greeting function",
            objective: "Complete the function body so message finishes as Hello Ada.",
            taskType: "level-3-block",
            concepts: ["Function call", "Function definition"],
            starterCode: `def greet(name):
    # Complete this block.
    pass

message = greet("Ada")`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "message", expected: "Hello Ada" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        },
        {
            id: "function-l4-program",
            title: "Write and call an area function",
            objective: "Write a function and call it so area finishes as 20.",
            taskType: "level-4-program",
            concepts: ["Function call", "Function definition"],
            starterCode: `# Write the whole function program below.
# Goal: area = rectangle_area(4, 5)
pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "area", expected: "20" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        },
        {
            id: "function-l5-debug",
            title: "Debug chained function calls",
            objective: "Find the broken call chain and fix it so result finishes as 25.",
            taskType: "level-5-debug",
            concepts: ["Function call"],
            debug: {
                line: 5,
                cause: "result adds five to first only once, so the final value is 20 instead of 25.",
                fixHint: "Make the second step apply add_five one more time, for example result = add_five(add_five(first))."
            },
            starterCode: `def add_five(number):
    return number + 5

first = add_five(10)
result = add_five(first)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "result", expected: "25" },
                { type: "conceptSeen", concept: "Function call" }
            ]
        }
    ],
    recursion: [
        {
            id: "recursion-l1-blank",
            title: "Fill the recursive call input",
            objective: "Replace the blank so answer finishes as 120.",
            taskType: "level-1-blank",
            concepts: ["Recursion"],
            starterCode: `def factorial(n):
    if n == 1:
        return 1
    return n * factorial(n - 1)

answer = factorial(___1___)`,
            blanks: [{ token: "___1___", label: "input value for factorial" }],
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "answer", expected: "120" },
                { type: "conceptSeen", concept: "Recursion" }
            ]
        },
        {
            id: "recursion-l2-line",
            title: "Write the recursive sum line",
            objective: "Write one line so answer finishes as 10.",
            taskType: "level-2-line",
            concepts: ["Recursion"],
            starterCode: `def sum_to(n):
    if n == 1:
        return 1
    # Write one line here.

answer = sum_to(4)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "answer", expected: "10" },
                { type: "conceptSeen", concept: "Recursion" }
            ]
        },
        {
            id: "recursion-l3-block",
            title: "Complete recursive power",
            objective: "Complete the recursive block so result finishes as 8.",
            taskType: "level-3-block",
            concepts: ["Recursion"],
            starterCode: `def power(base, exponent):
    if exponent == 0:
        return 1
    # Complete this block.
    pass

result = power(2, 3)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "result", expected: "8" },
                { type: "conceptSeen", concept: "Recursion" }
            ]
        },
        {
            id: "recursion-l4-program",
            title: "Write recursive countdown",
            objective: "Write a recursive function so final_value finishes as 0.",
            taskType: "level-4-program",
            concepts: ["Recursion"],
            starterCode: `# Write the whole recursive program below.
# Goal: final_value = countdown(2)
pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "final_value", expected: "0" },
                { type: "conceptSeen", concept: "Recursion" }
            ]
        },
        {
            id: "recursion-l5-debug",
            title: "Debug the Fibonacci call",
            objective: "Find the wrong call and fix it so answer finishes as 5.",
            taskType: "level-5-debug",
            concepts: ["Recursion"],
            debug: {
                line: 7,
                cause: "fib(4) returns 3, while the goal needs the value at fib(5).",
                fixHint: "Call fib(5) so answer finishes as 5."
            },
            starterCode: `def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

answer = fib(4)`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "answer", expected: "5" },
                { type: "conceptSeen", concept: "Recursion" }
            ]
        }
    ],
    complex: [
        {
            id: "complex-l1-blank",
            title: "Fill binary search blanks",
            objective: "Replace the blanks so found_index finishes as 3.",
            taskType: "level-1-blank",
            concepts: ["Loop", "Condition", "Algorithmic search"],
            starterCode: `numbers = [2, 4, 6, 8, 10, 12]
target = 8
left = 0
right = len(numbers) - 1
found_index = -1

while left <= right:
    mid = (left + right) // 2
    if numbers[mid] == ___1___:
        found_index = ___2___
        break
    elif numbers[mid] < target:
        left = mid + 1
    else:
        right = mid - 1`,
            blanks: [
                { token: "___1___", label: "comparison target" },
                { token: "___2___", label: "index to store" }
            ],
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "found_index", expected: "3" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "complex-l2-line",
            title: "Complete one search line",
            objective: "Write one line so pair_found finishes as True.",
            taskType: "level-2-line",
            concepts: ["Loop", "Condition", "Algorithmic search"],
            starterCode: `numbers = [1, 2, 4, 7, 11]
target = 9
left = 0
right = len(numbers) - 1
pair_found = False

while left < right:
    current_sum = numbers[left] + numbers[right]
    if current_sum == target:
        # Write one line here.
        break
    elif current_sum < target:
        left += 1
    else:
        right -= 1`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "pair_found", expected: "True" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "complex-l3-block",
            title: "Complete the frequency block",
            objective: "Complete the key block so count_a finishes as 3.",
            taskType: "level-3-block",
            concepts: ["Loop", "Condition", "Accumulator"],
            starterCode: `letters = ["a", "b", "a", "c", "a"]
counts = {}

for letter in letters:
    # Complete this block.
    pass

count_a = counts["a"]`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "count_a", expected: "3" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Condition" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        },
        {
            id: "complex-l4-program",
            title: "Write linear search",
            objective: "Write the loop body so found_index finishes as 2.",
            taskType: "level-4-program",
            concepts: ["Loop", "Condition", "Algorithmic search"],
            starterCode: `numbers = [5, 9, 12, 20]
target = 12
found_index = -1

for index in range(len(numbers)):
    # Write code here to update found_index when target is found.
    pass`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "found_index", expected: "2" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        },
        {
            id: "complex-l5-debug",
            title: "Debug linear search index",
            objective: "Find the wrong stored index and fix it so found_index finishes as 2.",
            taskType: "level-5-debug",
            concepts: ["Loop", "Condition", "Algorithmic search"],
            debug: {
                line: 7,
                cause: "The search finds the target, but it stores 0 instead of the current index.",
                fixHint: "Store found_index = index when numbers[index] equals target."
            },
            starterCode: `numbers = [5, 9, 12, 20]
target = 12
found_index = -1

for index in range(len(numbers)):
    if numbers[index] == target:
        found_index = 0
        break`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "found_index", expected: "2" },
                { type: "conceptSeen", concept: "Loop" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        }
    ]
};

const TOPIC_DETAILS = {
    assignment: {
        brief: "A variable name points to the latest value assigned to it. Reassigning the same name replaces the old value.",
        algorithm: "Read the right side first, compute that value, then store it under the name on the left side."
    },
    ifElse: {
        brief: "A condition lets a program choose between branches. Python runs the indented block under the first true condition.",
        algorithm: "Evaluate the condition, follow the matching branch, then continue after the branch."
    },
    forLoop: {
        brief: "A for loop repeats a block once for each item in a sequence, range, or collection.",
        algorithm: "Create the sequence, take one item, run the indented block, then repeat until no items remain."
    },
    whileLoop: {
        brief: "A while loop repeats while its condition remains true. The loop body must usually update something that can stop the loop.",
        algorithm: "Initialize a control value, test the condition, run the body, update the control value, and stop when the test fails."
    },
    listTraversal: {
        brief: "List traversal means visiting each list item in order so the program can inspect or use every value.",
        algorithm: "Start with a tracking variable, visit one item at a time, update the tracker, and read the final tracker value."
    },
    accumulator: {
        brief: "An accumulator keeps a running total, count, product, or combined result across repeated steps.",
        algorithm: "Initialize the accumulator, loop through values, update it each time, and read the final result after the loop."
    },
    nestedLoop: {
        brief: "A nested loop runs one loop inside another. The inner loop completes for each pass of the outer loop.",
        algorithm: "Choose an outer item, run the full inner loop for it, update the result for each pair, then move to the next outer item."
    },
    functionCall: {
        brief: "A function stores reusable instructions. A function call runs those instructions and can return a value.",
        algorithm: "Pass input values into the function, run its body, return a result, and store or use the returned result."
    },
    recursion: {
        brief: "Recursion is when a function calls itself on a smaller version of the same problem.",
        algorithm: "Handle the base case first, reduce the problem size on each recursive call, then combine returned values as calls finish."
    },
    simple: {
        brief: "Simple tasks combine two topics in a short program, such as a loop plus a condition or a function call plus assignment.",
        algorithm: "Identify the two concepts, trace the small program, then make the final variable match the goal."
    },
    medium: {
        brief: "Medium tasks combine about four topics, so students must connect traversal, conditions, accumulators, functions, and assignments.",
        algorithm: "Break the task into parts: input data, repeated work, decision logic, result update, and final value check."
    },
    complex: {
        brief: "Complex tasks include algorithmic patterns, code-writing prompts, and fill-in-the-blank code that must be completed before compiling.",
        algorithm: "Understand the algorithm goal first, fill or write the missing logic, run the trace, and inspect how the state changes over time."
    }
};

const LEARNING_MODES = {
    mission: {
        title: "Practice Path",
        panelTitle: "Practice Path",
        summary: "Complete topic levels in order. Each passed level unlocks the next one and updates skill progress."
    },
    prediction: {
        title: "Prediction Game",
        panelTitle: "Prediction Game",
        summary: "Run the code, pause on each trace step, and predict the next variable value before revealing it."
    },
    debug: {
        title: "Debug Detective",
        panelTitle: "Bug Report",
        summary: "Treat the starter code as suspicious. Pick the line that causes the goal gap, explain it, then fix it."
    },
    aiReview: {
        title: "AI Code Review",
        panelTitle: "AI Review Lab",
        summary: "Review a prewritten AI-style answer, identify quality problems, and improve the code with trace evidence."
    },
    skillTree: {
        title: "Growth Map",
        panelTitle: "Growth Map",
        summary: "See which programming skills this task trains and where the learner is building strength."
    }
};

const SKILL_DEFINITIONS = [
    { id: "tracing", label: "Trace Reading" },
    { id: "prediction", label: "Prediction" },
    { id: "variables", label: "Variables" },
    { id: "conditions", label: "Conditions" },
    { id: "loops", label: "Loops" },
    { id: "lists", label: "Lists" },
    { id: "accumulators", label: "Accumulators" },
    { id: "functions", label: "Functions" },
    { id: "debugging", label: "Debugging" },
    { id: "quality", label: "Code Quality" },
    { id: "aiReview", label: "AI Review" }
];

const CONCEPT_SKILL_MAP = {
    "Variable assignment": "variables",
    "Condition": "conditions",
    "Loop": "loops",
    "While loop": "loops",
    "List traversal": "lists",
    "List / sequence": "lists",
    "Accumulator": "accumulators",
    "Nested loop": "loops",
    "Function call": "functions",
    "Function definition": "functions",
    "Recursion": "functions"
};

const TASK_ENRICHMENTS = {
    "assignment:debug-tax-total": {
        story: "A receipt total ignores the tax value even though tax is available.",
        skills: ["variables", "debugging", "quality"],
        debug: {
            line: 3,
            cause: "total stores only price, so the tax value never reaches the final total.",
            fixHint: "Use both values on the right side, such as total = price + tax."
        }
    },
    "accumulator:sum-three": {
        story: "A warehouse counter is only remembering the last box instead of the full shipment.",
        missionOrder: 1,
        skills: ["loops", "accumulators", "prediction", "debugging"],
        debug: {
            line: 5,
            cause: "total_sum is overwritten with the current number instead of adding the number into the running total.",
            fixHint: "Use total_sum += number so the accumulator keeps its history."
        },
        aiReview: {
            prompt: "The AI draft runs, but it fails the real goal because it confuses assignment with accumulation.",
            concerns: [
                { id: "overwrites-total", label: "It overwrites the accumulator instead of updating it.", expected: true },
                { id: "missing-trace-evidence", label: "It needs trace evidence to prove total_sum is 60.", expected: true },
                { id: "syntax-problem", label: "It has a Python syntax error.", expected: false }
            ]
        }
    },
    "forLoop:range-total": {
        story: "The range scanner visits the right numbers, but the total is not keeping the previous values.",
        missionOrder: 2,
        skills: ["loops", "accumulators", "prediction", "debugging"],
        debug: {
            line: 4,
            cause: "total is replaced by each number, so only the final loop item remains.",
            fixHint: "Add number into total on each loop pass."
        }
    },
    "forLoop:debug-loop-total": {
        story: "The loop visits every number, but the total forgets earlier visits.",
        skills: ["loops", "accumulators", "debugging"],
        debug: {
            line: 4,
            cause: "total is overwritten with each number instead of accumulating the running total.",
            fixHint: "Replace the overwrite with an accumulator update such as total += number."
        }
    },
    "whileLoop:debug-while-total": {
        story: "The while loop reaches the right values, but the total remembers only the last value.",
        skills: ["loops", "accumulators", "debugging"],
        debug: {
            line: 5,
            cause: "total is assigned the current number each pass, so earlier values are lost.",
            fixHint: "Use total += number before number increases."
        }
    },
    "listTraversal:largest-value": {
        story: "A list scanner needs to remember the largest item, not just the last item it saw.",
        missionOrder: 3,
        skills: ["lists", "conditions", "debugging", "prediction"],
        debug: {
            line: 5,
            cause: "largest is updated every time, even when the new number is smaller.",
            fixHint: "Only update largest when number is greater than the current largest."
        }
    },
    "listTraversal:sum-list": {
        story: "The list traversal sees every value, but the running total gets overwritten.",
        skills: ["lists", "accumulators", "debugging"],
        debug: {
            line: 5,
            cause: "total is replaced by each list item instead of adding the item into the total.",
            fixHint: "Use total += number inside the loop."
        }
    },
    "ifElse:boundary-score": {
        story: "A grading gate is rejecting a score exactly on the pass boundary.",
        missionOrder: 4,
        skills: ["conditions", "debugging"],
        debug: {
            line: 3,
            cause: "The condition uses >, so a score of exactly 60 falls into the retry branch.",
            fixHint: "Use >= when the boundary value should pass."
        }
    },
    "accumulator:count-positives": {
        story: "The condition finds positive values, but the counter resets to one each time.",
        skills: ["conditions", "accumulators", "debugging"],
        debug: {
            line: 6,
            cause: "positive_count is assigned 1 for every positive number, so it never counts past one.",
            fixHint: "Use positive_count += 1 inside the if block."
        }
    },
    "nestedLoop:even-grid-count": {
        story: "The nested loop finds even values, but the counter is reset instead of increased.",
        skills: ["loops", "conditions", "debugging"],
        debug: {
            line: 7,
            cause: "even_count is set to 1 for each even value, so it does not count all matches.",
            fixHint: "Use even_count += 1 inside the nested condition."
        }
    },
    "functionCall:call-twice": {
        story: "The function calls are valid, but the final result has not applied enough increments for the goal.",
        skills: ["functions", "debugging", "quality"],
        debug: {
            line: 5,
            cause: "result adds five to first only once, so the final value is 20 instead of 25.",
            fixHint: "Make the second step apply add_five one more time, for example result = add_five(add_five(first))."
        }
    },
    "recursion:fibonacci-five": {
        story: "The recursive function is correct, but the call asks for the wrong Fibonacci position.",
        skills: ["functions", "debugging", "quality"],
        debug: {
            line: 7,
            cause: "fib(4) returns 3, while the goal needs the value at fib(5).",
            fixHint: "Call fib(5) so answer finishes as 5."
        }
    },
    "complex:complex-write-linear-search": {
        story: "The search loop is present, but the important condition and update are still missing.",
        skills: ["loops", "conditions", "debugging", "quality"],
        debug: {
            line: 6,
            cause: "pass leaves the loop body empty, so found_index never changes when the target appears.",
            fixHint: "Inside the loop, check numbers[index] == target, set found_index = index, then break."
        }
    },
    "simple:simple-filter-total": {
        story: "The filter finds eligible numbers, but the result forgets earlier matches.",
        missionOrder: 5,
        skills: ["loops", "conditions", "accumulators", "quality"],
        debug: {
            line: 6,
            cause: "total is replaced by each matching number instead of adding matching numbers together.",
            fixHint: "Use total += number inside the condition."
        }
    },
    "medium:medium-discount-total": {
        story: "A checkout assistant applies discounts, but only the last discount reaches the total.",
        missionOrder: 6,
        skills: ["lists", "conditions", "accumulators", "functions", "aiReview", "quality"],
        debug: {
            line: 9,
            cause: "discounted_total is set to one discounted price instead of accumulating every eligible discounted price.",
            fixHint: "Use discounted_total += discount(price)."
        },
        aiReview: {
            prompt: "The AI draft is plausible, but a reviewer should ask whether it handles every eligible price and proves the final total.",
            concerns: [
                { id: "not-accumulating", label: "It stores only the latest eligible discount instead of accumulating all eligible prices.", expected: true },
                { id: "needs-boundary", label: "It should keep the >= 8 boundary because price 8 is eligible.", expected: true },
                { id: "bad-function-name", label: "The function name is unreadable.", expected: false }
            ]
        }
    },
    "simple:simple-list-count": {
        story: "An AI helper counted one item repeatedly instead of tracking the whole list.",
        missionOrder: 7,
        skills: ["lists", "accumulators", "aiReview", "quality"],
        debug: {
            line: 5,
            cause: "item_count is set to 1 on every pass, so it never grows.",
            fixHint: "Increment item_count on each loop pass."
        },
        aiReview: {
            prompt: "The AI draft has the right loop shape, but its state update does not match the counting goal.",
            concerns: [
                { id: "constant-assignment", label: "The counter is assigned a constant instead of incremented.", expected: true },
                { id: "clear-names", label: "The variable names are reasonably clear.", expected: false },
                { id: "needs-empty-list-thinking", label: "A reviewer should ask what the result should be for an empty list.", expected: true }
            ]
        }
    }
};

const LEVEL_STAGE_LABELS = [
    "Fill a key expression",
    "Write one complete line",
    "Write the complete program",
    "Refine redundant code",
    "Fix broken code"
];

const PYTHON_FUNCTION_HINTS = {
    range: {
        name: "range()",
        example: "for i in range(1, 4): visits 1, 2, 3",
        purpose: "Creates a sequence of numbers for a loop."
    },
    len: {
        name: "len()",
        example: "len([10, 20, 30]) returns 3",
        purpose: "Counts how many items are inside a string, list, or other collection."
    },
    sum: {
        name: "sum()",
        example: "sum([2, 3, 5]) returns 10",
        purpose: "Adds all numeric items in a collection."
    },
    max: {
        name: "max()",
        example: "max([2, 8, 5]) returns 8",
        purpose: "Finds the largest value."
    },
    min: {
        name: "min()",
        example: "min([2, 8, 5]) returns 2",
        purpose: "Finds the smallest value."
    },
    enumerate: {
        name: "enumerate()",
        example: "for index, value in enumerate(items): gives both position and item",
        purpose: "Loops through a collection while also tracking each item's index."
    },
    abs: {
        name: "abs()",
        example: "abs(-4) returns 4",
        purpose: "Converts a number to its distance from zero."
    },
    int: {
        name: "int()",
        example: "int(\"12\") returns 12",
        purpose: "Converts a compatible value into an integer."
    },
    str: {
        name: "str()",
        example: "str(12) returns \"12\"",
        purpose: "Converts a value into text."
    }
};

function taskFix(solution) {
    return `One valid answer:\n${solution}`;
}

function goalChecks({ variable, expected, concepts = [], solution, noErrorFix, extra = [] }) {
    return [
        { type: "noErrors", fix: noErrorFix || taskFix(solution) },
        { type: "variableEquals", variable, expected, fix: taskFix(solution) },
        ...concepts.map(concept => ({ type: "conceptSeen", concept, fix: taskFix(solution) })),
        ...extra
    ];
}

function codeRegexCheck(pattern, label, fix, flags = "") {
    return { type: "codeRegex", pattern, flags, label, fix };
}

function maxLinesCheck(max, label, fix) {
    return { type: "maxNonEmptyLines", max, label, fix };
}

function makeLevelTask({ id, title, objective, taskType, concepts, starterCode, blanks = [], variable, expected, solution, noErrorFix, extraChecks = [], functionHints = [], debug = null }) {
    return {
        id,
        title,
        objective,
        taskType,
        concepts,
        starterCode,
        blanks,
        solution: taskFix(solution),
        errorFix: noErrorFix || taskFix(solution),
        algorithmFix: taskFix(solution),
        functionHints,
        debug,
        checks: goalChecks({
            variable,
            expected,
            concepts,
            solution,
            noErrorFix,
            extra: extraChecks
        })
    };
}

const REVISED_STUDENT_LEVEL_TASKS = {
    assignment: [
        makeLevelTask({
            id: "assignment-l1-blank",
            title: "Complete the assigned value",
            objective: "Fill the right-side Python string so student_name stores Ada.",
            taskType: "level-1-blank",
            concepts: ["Variable assignment"],
            starterCode: `student_name = ___1___`,
            blanks: [{ token: "___1___", label: "quoted string value assigned to student_name" }],
            variable: "student_name",
            expected: "Ada",
            solution: `student_name = "Ada"`
        }),
        makeLevelTask({
            id: "assignment-l2-line",
            title: "Copy a value with one line",
            objective: "Replace pass with one complete line so display_name copies first_name.",
            taskType: "level-2-line",
            concepts: ["Variable assignment"],
            starterCode: `first_name = "Grace"
# Write one complete line below.
pass`,
            variable: "display_name",
            expected: "Grace",
            solution: `first_name = "Grace"
display_name = first_name`
        }),
        makeLevelTask({
            id: "assignment-l3-block",
            title: "Write the complete calculation",
            objective: "Write a complete short program that computes total from price and quantity.",
            taskType: "level-3-program",
            concepts: ["Variable assignment"],
            starterCode: `# Write the complete program.
# Goal: price = 10, quantity = 3, total = price * quantity
pass`,
            variable: "total",
            expected: "30",
            solution: `price = 10
quantity = 3
total = price * quantity`
        }),
        makeLevelTask({
            id: "assignment-l4-program",
            title: "Refine copied assignments",
            objective: "This code copies the same value through too many temporary names. Refine it so display_name still finishes as Ada using fewer meaningful lines.",
            taskType: "level-4-refactor",
            concepts: ["Variable assignment"],
            starterCode: `name = "Ada"
student_name = name
final_name = student_name
extra_copy = final_name
display_name = extra_copy`,
            variable: "display_name",
            expected: "Ada",
            solution: `student_name = "Ada"
display_name = student_name`,
            extraChecks: [
                maxLinesCheck(3, "Refine the repeated copies to 3 or fewer non-empty lines.", `One valid refined answer:\nstudent_name = "Ada"\ndisplay_name = student_name`)
            ]
        }),
        makeLevelTask({
            id: "assignment-l5-debug",
            title: "Fix a missing variable error",
            objective: "The code cannot run because one variable is missing. Repair it so total finishes as 22.",
            taskType: "level-5-debug",
            concepts: ["Variable assignment"],
            starterCode: `price = 20
total = price + tax`,
            variable: "total",
            expected: "22",
            solution: `price = 20
tax = 2
total = price + tax`,
            noErrorFix: `Define tax before using it. Correct answer:\nprice = 20\ntax = 2\ntotal = price + tax`,
            debug: {
                line: 2,
                cause: "tax is used before it has been assigned.",
                fixHint: "Define tax = 2 before computing total."
            }
        })
    ],
    ifElse: [
        makeLevelTask({
            id: "ifelse-l1-blank",
            title: "Fill the pass condition",
            objective: "Fill the condition expression so result becomes pass.",
            taskType: "level-1-blank",
            concepts: ["Condition"],
            starterCode: `score = 72

if ___1___:
    result = "pass"
else:
    result = "retry"`,
            blanks: [{ token: "___1___", label: "condition expression that passes at 60 or higher" }],
            variable: "result",
            expected: "pass",
            solution: `score = 72

if score >= 60:
    result = "pass"
else:
    result = "retry"`
        }),
        makeLevelTask({
            id: "ifelse-l2-line",
            title: "Write the true branch line",
            objective: "Replace pass with one complete line inside the true branch.",
            taskType: "level-2-line",
            concepts: ["Condition"],
            starterCode: `temperature = 35

if temperature >= 30:
    pass
else:
    message = "cool"`,
            variable: "message",
            expected: "hot",
            solution: `temperature = 35

if temperature >= 30:
    message = "hot"
else:
    message = "cool"`
        }),
        makeLevelTask({
            id: "ifelse-l3-block",
            title: "Write a complete decision program",
            objective: "Write a complete if/else program so grade finishes as A.",
            taskType: "level-3-program",
            concepts: ["Condition"],
            starterCode: `# Write the complete program.
# Goal: score = 88, grade = "A" when score is at least 80.
pass`,
            variable: "grade",
            expected: "A",
            solution: `score = 88
if score >= 80:
    grade = "A"
else:
    grade = "review"`
        }),
        makeLevelTask({
            id: "ifelse-l4-program",
            title: "Refine repeated grade checks",
            objective: "The draft repeats separate if checks. Refine it into one clear if/elif/else-style decision while keeping grade as A.",
            taskType: "level-4-refactor",
            concepts: ["Condition"],
            starterCode: `score = 85
grade = "F"
if score >= 60:
    grade = "D"
if score >= 70:
    grade = "C"
if score >= 80:
    grade = "A"`,
            variable: "grade",
            expected: "A",
            solution: `score = 85
if score >= 80:
    grade = "A"
else:
    grade = "review"`,
            extraChecks: [
                codeRegexCheck("\\belse\\b|\\belif\\b", "Refined condition should use else or elif instead of separate repeated if statements.", `Use one decision structure, for example:\nscore = 85\nif score >= 80:\n    grade = "A"\nelse:\n    grade = "review"`),
                maxLinesCheck(6, "Refine the repeated condition code to 6 or fewer non-empty lines.", `One valid refined answer:\nscore = 85\nif score >= 80:\n    grade = "A"\nelse:\n    grade = "review"`)
            ]
        }),
        makeLevelTask({
            id: "ifelse-l5-debug",
            title: "Fix a missing threshold error",
            objective: "The code cannot run because passing_score is missing. Repair it so result finishes as pass.",
            taskType: "level-5-debug",
            concepts: ["Condition"],
            starterCode: `score = 72
if score >= passing_score:
    result = "pass"
else:
    result = "retry"`,
            variable: "result",
            expected: "pass",
            solution: `score = 72
passing_score = 60
if score >= passing_score:
    result = "pass"
else:
    result = "retry"`,
            noErrorFix: "Define passing_score = 60 before the if statement, or compare score directly with 60.",
            debug: {
                line: 2,
                cause: "passing_score is used before it exists.",
                fixHint: "Add passing_score = 60 before the condition."
            }
        })
    ],
    forLoop: [
        makeLevelTask({
            id: "for-l1-blank",
            title: "Fill the range expression",
            objective: "Fill the iterable expression so the loop visits 1, 2, and 3.",
            taskType: "level-1-blank",
            concepts: ["Loop"],
            starterCode: `last_number = 0

for number in ___1___:
    last_number = number`,
            blanks: [{ token: "___1___", label: "range expression that visits 1 through 3" }],
            variable: "last_number",
            expected: "3",
            solution: `last_number = 0

for number in range(1, 4):
    last_number = number`,
            functionHints: ["range"]
        }),
        makeLevelTask({
            id: "for-l2-line",
            title: "Count loop passes",
            objective: "Replace pass with one complete accumulator line.",
            taskType: "level-2-line",
            concepts: ["Loop", "Accumulator"],
            starterCode: `loop_count = 0

for number in range(4):
    pass`,
            variable: "loop_count",
            expected: "4",
            solution: `loop_count = 0

for number in range(4):
    loop_count += 1`,
            functionHints: ["range"]
        }),
        makeLevelTask({
            id: "for-l3-block",
            title: "Write a complete for-loop program",
            objective: "Write a complete program that uses a for loop to make total finish as 10.",
            taskType: "level-3-program",
            concepts: ["Loop", "Accumulator"],
            starterCode: `# Write the complete program.
# Goal: add 1 + 2 + 3 + 4 into total.
pass`,
            variable: "total",
            expected: "10",
            solution: `total = 0
for number in range(1, 5):
    total += number`,
            functionHints: ["range"]
        }),
        makeLevelTask({
            id: "for-l4-program",
            title: "Refine repeated additions into a loop",
            objective: "The draft repeats the same addition pattern. Replace the repeated lines with a for loop using range().",
            taskType: "level-4-refactor",
            concepts: ["Loop", "Accumulator"],
            starterCode: `total = 0
total = total + 1
total = total + 2
total = total + 3
total = total + 4`,
            variable: "total",
            expected: "10",
            solution: `total = 0
for number in range(1, 5):
    total += number`,
            functionHints: ["range"],
            extraChecks: [
                codeRegexCheck("\\bfor\\b[\\s\\S]*\\brange\\s*\\(", "Refined code should use a for loop with range().", `Use range():\ntotal = 0\nfor number in range(1, 5):\n    total += number`),
                maxLinesCheck(4, "Refine repeated addition to 4 or fewer non-empty lines.", `One valid refined answer:\ntotal = 0\nfor number in range(1, 5):\n    total += number`)
            ]
        }),
        makeLevelTask({
            id: "for-l5-debug",
            title: "Fix a missing range variable",
            objective: "The code cannot run because stop_value is missing. Repair it so total finishes as 6.",
            taskType: "level-5-debug",
            concepts: ["Loop", "Accumulator"],
            starterCode: `total = 0
for number in range(1, stop_value):
    total += number`,
            variable: "total",
            expected: "6",
            solution: `total = 0
stop_value = 4
for number in range(1, stop_value):
    total += number`,
            functionHints: ["range"],
            noErrorFix: "Define stop_value = 4 before the loop, or write range(1, 4).",
            debug: {
                line: 2,
                cause: "stop_value is used before it has a value.",
                fixHint: "Add stop_value = 4 before range(), or use range(1, 4)."
            }
        })
    ],
    whileLoop: [
        makeLevelTask({
            id: "while-l1-blank",
            title: "Fill the while condition",
            objective: "Fill the condition expression so the loop stops after count reaches 5.",
            taskType: "level-1-blank",
            concepts: ["Loop"],
            starterCode: `count = 0

while ___1___:
    count += 1`,
            blanks: [{ token: "___1___", label: "condition that remains true while count is below 5" }],
            variable: "count",
            expected: "5",
            solution: `count = 0

while count < 5:
    count += 1`
        }),
        makeLevelTask({
            id: "while-l2-line",
            title: "Write the decrement line",
            objective: "Replace pass with one complete line so the loop can finish.",
            taskType: "level-2-line",
            concepts: ["Loop"],
            starterCode: `fuel = 3

while fuel > 0:
    pass`,
            variable: "fuel",
            expected: "0",
            solution: `fuel = 3

while fuel > 0:
    fuel -= 1`
        }),
        makeLevelTask({
            id: "while-l3-block",
            title: "Write a complete while-loop program",
            objective: "Write a complete program that uses while to make total finish as 10.",
            taskType: "level-3-program",
            concepts: ["Loop", "Accumulator"],
            starterCode: `# Write the complete program.
# Goal: add 1 + 2 + 3 + 4 into total using while.
pass`,
            variable: "total",
            expected: "10",
            solution: `number = 1
total = 0
while number <= 4:
    total += number
    number += 1`
        }),
        makeLevelTask({
            id: "while-l4-program",
            title: "Refine repeated increments into while",
            objective: "The draft repeats the same increment. Replace the repeated lines with one while loop.",
            taskType: "level-4-refactor",
            concepts: ["Loop"],
            starterCode: `count = 0
count += 1
count += 1
count += 1
count += 1
count += 1`,
            variable: "count",
            expected: "5",
            solution: `count = 0
while count < 5:
    count += 1`,
            extraChecks: [
                codeRegexCheck("\\bwhile\\b", "Refined code should use a while loop.", `Use while:\ncount = 0\nwhile count < 5:\n    count += 1`),
                maxLinesCheck(4, "Refine repeated increments to 4 or fewer non-empty lines.", `One valid refined answer:\ncount = 0\nwhile count < 5:\n    count += 1`)
            ]
        }),
        makeLevelTask({
            id: "while-l5-debug",
            title: "Fix a missing target value",
            objective: "The code cannot run because target is missing. Repair it so count finishes as 5.",
            taskType: "level-5-debug",
            concepts: ["Loop"],
            starterCode: `count = 0
while count < target:
    count += 1`,
            variable: "count",
            expected: "5",
            solution: `count = 0
target = 5
while count < target:
    count += 1`,
            noErrorFix: "Define target = 5 before the while loop.",
            debug: {
                line: 2,
                cause: "target is used before it has been assigned.",
                fixHint: "Add target = 5 before the while loop."
            }
        })
    ],
    listTraversal: [
        makeLevelTask({
            id: "list-l1-blank",
            title: "Fill the list access expression",
            objective: "Fill the expression that reads the first color from the list.",
            taskType: "level-1-blank",
            concepts: ["List / sequence"],
            starterCode: `colors = ["red", "green", "blue"]
first_color = ___1___`,
            blanks: [{ token: "___1___", label: "list access expression for the first item" }],
            variable: "first_color",
            expected: "red",
            solution: `colors = ["red", "green", "blue"]
first_color = colors[0]`
        }),
        makeLevelTask({
            id: "list-l2-line",
            title: "Write the largest update line",
            objective: "Replace pass with one complete line that updates largest.",
            taskType: "level-2-line",
            concepts: ["List traversal", "Condition"],
            starterCode: `numbers = [2, 6, 4]
largest = 0

for number in numbers:
    if number > largest:
        pass`,
            variable: "largest",
            expected: "6",
            solution: `numbers = [2, 6, 4]
largest = 0

for number in numbers:
    if number > largest:
        largest = number`
        }),
        makeLevelTask({
            id: "list-l3-block",
            title: "Write a complete list traversal",
            objective: "Write a complete traversal that counts every item in the list.",
            taskType: "level-3-program",
            concepts: ["List traversal", "Accumulator"],
            starterCode: `# Write the complete program.
# Goal: item_count = 4 for this list: ["pen", "book", "bag", "key"]
pass`,
            variable: "item_count",
            expected: "4",
            solution: `items = ["pen", "book", "bag", "key"]
item_count = 0
for item in items:
    item_count += 1`
        }),
        makeLevelTask({
            id: "list-l4-program",
            title: "Refine repeated index access",
            objective: "The draft reads each index by hand. Refine it into a list traversal loop.",
            taskType: "level-4-refactor",
            concepts: ["List traversal", "Loop"],
            starterCode: `colors = ["red", "green", "blue"]
current_color = colors[0]
current_color = colors[1]
current_color = colors[2]`,
            variable: "current_color",
            expected: "blue",
            solution: `colors = ["red", "green", "blue"]
for color in colors:
    current_color = color`,
            extraChecks: [
                codeRegexCheck("\\bfor\\b[\\s\\S]*\\bin\\b[\\s\\S]*colors", "Refined code should traverse colors with a for loop.", `Use traversal:\ncolors = ["red", "green", "blue"]\nfor color in colors:\n    current_color = color`),
                maxLinesCheck(4, "Refine repeated index access to 4 or fewer non-empty lines.", `One valid refined answer:\ncolors = ["red", "green", "blue"]\nfor color in colors:\n    current_color = color`)
            ]
        }),
        makeLevelTask({
            id: "list-l5-debug",
            title: "Fix an index error",
            objective: "The code cannot run because the list index is out of range. Repair it so first_color finishes as red.",
            taskType: "level-5-debug",
            concepts: ["List / sequence"],
            starterCode: `colors = ["red", "green", "blue"]
first_color = colors[3]`,
            variable: "first_color",
            expected: "red",
            solution: `colors = ["red", "green", "blue"]
first_color = colors[0]`,
            noErrorFix: "Use index 0 for the first item: first_color = colors[0].",
            debug: {
                line: 2,
                cause: "colors[3] asks for a fourth item, but the list has indexes 0, 1, and 2.",
                fixHint: "Use colors[0] to access the first color."
            }
        })
    ],
    accumulator: [
        makeLevelTask({
            id: "accumulator-l1-blank",
            title: "Fill the accumulator expression",
            objective: "Fill the right-side expression that keeps the previous total and adds the current number.",
            taskType: "level-1-blank",
            concepts: ["Accumulator"],
            starterCode: `total_sum = 0
numbers = [10, 20, 30]

for number in numbers:
    total_sum = ___1___`,
            blanks: [{ token: "___1___", label: "accumulator expression using total_sum and number" }],
            variable: "total_sum",
            expected: "60",
            solution: `total_sum = 0
numbers = [10, 20, 30]

for number in numbers:
    total_sum += number`
        }),
        makeLevelTask({
            id: "accumulator-l2-line",
            title: "Write one accumulator update",
            objective: "Replace pass with one complete line that adds each price into total_sum.",
            taskType: "level-2-line",
            concepts: ["Accumulator"],
            starterCode: `total_sum = 0
prices = [10, 20, 30, 40]

for price in prices:
    pass`,
            variable: "total_sum",
            expected: "100",
            solution: `total_sum = 0
prices = [10, 20, 30, 40]

for price in prices:
    total_sum += price`
        }),
        makeLevelTask({
            id: "accumulator-l3-block",
            title: "Write a complete length accumulator",
            objective: "Write a complete program that uses len() to total the lengths of all words.",
            taskType: "level-3-program",
            concepts: ["Accumulator", "List traversal"],
            starterCode: `# Write the complete program.
# Goal: total_length = len("cat") + len("tree") + len("go")
pass`,
            variable: "total_length",
            expected: "9",
            solution: `words = ["cat", "tree", "go"]
total_length = 0
for word in words:
    total_length += len(word)`,
            functionHints: ["len"]
        }),
        makeLevelTask({
            id: "accumulator-l4-program",
            title: "Refine repeated additions into an accumulator",
            objective: "The draft repeats addition lines. Refine it into a loop accumulator that keeps the same final total.",
            taskType: "level-4-refactor",
            concepts: ["Accumulator", "Loop"],
            starterCode: `total_sum = 0
total_sum += 10
total_sum += 20
total_sum += 30
total_sum += 40`,
            variable: "total_sum",
            expected: "100",
            solution: `prices = [10, 20, 30, 40]
total_sum = 0
for price in prices:
    total_sum += price`,
            extraChecks: [
                codeRegexCheck("\\bfor\\b[\\s\\S]*\\+=", "Refined code should use a loop with an accumulator update such as +=.", `Use an accumulator loop:\nprices = [10, 20, 30, 40]\ntotal_sum = 0\nfor price in prices:\n    total_sum += price`),
                maxLinesCheck(5, "Refine repeated additions to 5 or fewer non-empty lines.", `One valid refined answer:\nprices = [10, 20, 30, 40]\ntotal_sum = 0\nfor price in prices:\n    total_sum += price`)
            ]
        }),
        makeLevelTask({
            id: "accumulator-l5-debug",
            title: "Fix an uninitialized accumulator",
            objective: "The code cannot run because total_sum is used before it exists. Repair it so total_sum finishes as 60.",
            taskType: "level-5-debug",
            concepts: ["Accumulator"],
            starterCode: `numbers = [10, 20, 30]
for number in numbers:
    total_sum += number`,
            variable: "total_sum",
            expected: "60",
            solution: `numbers = [10, 20, 30]
total_sum = 0
for number in numbers:
    total_sum += number`,
            noErrorFix: "Initialize total_sum = 0 before the loop.",
            debug: {
                line: 3,
                cause: "total_sum is updated with += before it has been initialized.",
                fixHint: "Add total_sum = 0 before the loop."
            }
        })
    ],
    nestedLoop: [
        makeLevelTask({
            id: "nested-l1-blank",
            title: "Fill the nested counter expression",
            objective: "Fill the expression that counts one row/column pair each time the inner loop runs.",
            taskType: "level-1-blank",
            concepts: ["Nested loop"],
            starterCode: `pair_count = 0
rows = ["A", "B"]
cols = [1, 2, 3]

for row in rows:
    for col in cols:
        pair_count = ___1___`,
            blanks: [{ token: "___1___", label: "counter expression that adds one pair" }],
            variable: "pair_count",
            expected: "6",
            solution: `pair_count = 0
rows = ["A", "B"]
cols = [1, 2, 3]

for row in rows:
    for col in cols:
        pair_count += 1`
        }),
        makeLevelTask({
            id: "nested-l2-line",
            title: "Write one inner-loop update",
            objective: "Replace pass with one complete line inside the inner loop.",
            taskType: "level-2-line",
            concepts: ["Nested loop", "Accumulator"],
            starterCode: `letters = ["A", "B"]
numbers = [1, 2]
label_count = 0

for letter in letters:
    for number in numbers:
        pass`,
            variable: "label_count",
            expected: "4",
            solution: `letters = ["A", "B"]
numbers = [1, 2]
label_count = 0

for letter in letters:
    for number in numbers:
        label_count += 1`
        }),
        makeLevelTask({
            id: "nested-l3-block",
            title: "Write a complete grid total",
            objective: "Write a complete nested-loop program that totals every value in the grid.",
            taskType: "level-3-program",
            concepts: ["Nested loop", "Accumulator"],
            starterCode: `# Write the complete program.
# Goal: grid_total = 21 for rows [[1, 2, 3], [4, 5, 6]]
pass`,
            variable: "grid_total",
            expected: "21",
            solution: `rows = [[1, 2, 3], [4, 5, 6]]
grid_total = 0
for row in rows:
    for value in row:
        grid_total += value`
        }),
        makeLevelTask({
            id: "nested-l4-program",
            title: "Refine repeated pair counting",
            objective: "The draft counts each pair by hand. Refine it into nested loops over rows and cols.",
            taskType: "level-4-refactor",
            concepts: ["Nested loop", "Accumulator"],
            starterCode: `pair_count = 0
pair_count += 1
pair_count += 1
pair_count += 1
pair_count += 1
pair_count += 1
pair_count += 1`,
            variable: "pair_count",
            expected: "6",
            solution: `rows = ["A", "B"]
cols = [1, 2, 3]
pair_count = 0
for row in rows:
    for col in cols:
        pair_count += 1`,
            extraChecks: [
                codeRegexCheck("\\bfor\\b[\\s\\S]*\\bfor\\b", "Refined code should use nested for loops.", `Use nested loops:\nrows = ["A", "B"]\ncols = [1, 2, 3]\npair_count = 0\nfor row in rows:\n    for col in cols:\n        pair_count += 1`),
                maxLinesCheck(7, "Refine repeated pair-count lines to 7 or fewer non-empty lines.", `One valid refined answer:\nrows = ["A", "B"]\ncols = [1, 2, 3]\npair_count = 0\nfor row in rows:\n    for col in cols:\n        pair_count += 1`)
            ]
        }),
        makeLevelTask({
            id: "nested-l5-debug",
            title: "Fix a typo inside the inner loop",
            objective: "The code cannot run because roww is not defined. Repair it so even_count finishes as 3.",
            taskType: "level-5-debug",
            concepts: ["Nested loop", "Condition"],
            starterCode: `rows = [[1, 2], [3, 4], [5, 6]]
even_count = 0

for row in rows:
    for value in roww:
        if value % 2 == 0:
            even_count += 1`,
            variable: "even_count",
            expected: "3",
            solution: `rows = [[1, 2], [3, 4], [5, 6]]
even_count = 0

for row in rows:
    for value in row:
        if value % 2 == 0:
            even_count += 1`,
            noErrorFix: "Change roww to row inside the inner loop.",
            debug: {
                line: 5,
                cause: "roww is a typo; the outer loop variable is named row.",
                fixHint: "Use for value in row: in the inner loop."
            }
        })
    ],
    functionCall: [
        makeLevelTask({
            id: "function-l1-blank",
            title: "Fill the function call",
            objective: "Fill the function-call expression so answer stores the returned value.",
            taskType: "level-1-blank",
            concepts: ["Function call"],
            starterCode: `def square(number):
    return number * number

answer = ___1___`,
            blanks: [{ token: "___1___", label: "function call that returns 16" }],
            variable: "answer",
            expected: "16",
            solution: `def square(number):
    return number * number

answer = square(4)`
        }),
        makeLevelTask({
            id: "function-l2-line",
            title: "Write one return line",
            objective: "Replace pass with one complete return line.",
            taskType: "level-2-line",
            concepts: ["Function call"],
            starterCode: `def double(number):
    pass

answer = double(7)`,
            variable: "answer",
            expected: "14",
            solution: `def double(number):
    return number * 2

answer = double(7)`
        }),
        makeLevelTask({
            id: "function-l3-block",
            title: "Write a complete function program",
            objective: "Write a complete program with a function call so area finishes as 20.",
            taskType: "level-3-program",
            concepts: ["Function call"],
            starterCode: `# Write the complete program.
# Goal: define rectangle_area and set area = rectangle_area(4, 5)
pass`,
            variable: "area",
            expected: "20",
            solution: `def rectangle_area(width, height):
    return width * height

area = rectangle_area(4, 5)`
        }),
        makeLevelTask({
            id: "function-l4-program",
            title: "Refine repeated calculations into a function",
            objective: "The draft repeats the same area calculation. Refine it by defining and calling a function.",
            taskType: "level-4-refactor",
            concepts: ["Function call"],
            starterCode: `width = 4
height = 5
area_one = width * height
area_two = width * height
area = area_two`,
            variable: "area",
            expected: "20",
            solution: `def rectangle_area(width, height):
    return width * height

area = rectangle_area(4, 5)`,
            extraChecks: [
                codeRegexCheck("\\bdef\\b[\\s\\S]*\\barea\\s*=", "Refined code should define a function and store the function call result.", `Use a function:\ndef rectangle_area(width, height):\n    return width * height\n\narea = rectangle_area(4, 5)`),
                maxLinesCheck(5, "Refine repeated calculations to 5 or fewer non-empty lines.", `One valid refined answer:\ndef rectangle_area(width, height):\n    return width * height\n\narea = rectangle_area(4, 5)`)
            ]
        }),
        makeLevelTask({
            id: "function-l5-debug",
            title: "Fix a misspelled function call",
            objective: "The code cannot run because the function name is misspelled. Repair it so answer finishes as 16.",
            taskType: "level-5-debug",
            concepts: ["Function call"],
            starterCode: `def square(number):
    return number * number

answer = squre(4)`,
            variable: "answer",
            expected: "16",
            solution: `def square(number):
    return number * number

answer = square(4)`,
            noErrorFix: "Call square(4), not squre(4).",
            debug: {
                line: 4,
                cause: "squre is not defined because the function is named square.",
                fixHint: "Change squre(4) to square(4)."
            }
        })
    ],
    recursion: [
        makeLevelTask({
            id: "recursion-l1-blank",
            title: "Fill the recursive call",
            objective: "Fill the smaller recursive call used to finish factorial.",
            taskType: "level-1-blank",
            concepts: ["Recursion"],
            starterCode: `def factorial(n):
    if n == 1:
        return 1
    return n * ___1___

answer = factorial(5)`,
            blanks: [{ token: "___1___", label: "recursive call on the smaller problem" }],
            variable: "answer",
            expected: "120",
            solution: `def factorial(n):
    if n == 1:
        return 1
    return n * factorial(n - 1)

answer = factorial(5)`
        }),
        makeLevelTask({
            id: "recursion-l2-line",
            title: "Write one recursive return line",
            objective: "Replace pass with one complete recursive return line.",
            taskType: "level-2-line",
            concepts: ["Recursion"],
            starterCode: `def sum_to(n):
    if n == 1:
        return 1
    pass

answer = sum_to(4)`,
            variable: "answer",
            expected: "10",
            solution: `def sum_to(n):
    if n == 1:
        return 1
    return n + sum_to(n - 1)

answer = sum_to(4)`
        }),
        makeLevelTask({
            id: "recursion-l3-block",
            title: "Write a complete recursive program",
            objective: "Write a complete recursive power function so result finishes as 8.",
            taskType: "level-3-program",
            concepts: ["Recursion"],
            starterCode: `# Write the complete recursive program.
# Goal: result = power(2, 3)
pass`,
            variable: "result",
            expected: "8",
            solution: `def power(base, exponent):
    if exponent == 0:
        return 1
    return base * power(base, exponent - 1)

result = power(2, 3)`
        }),
        makeLevelTask({
            id: "recursion-l4-program",
            title: "Refine repeated multiplication into recursion",
            objective: "The draft hard-codes a factorial multiplication. Refine it into a recursive function.",
            taskType: "level-4-refactor",
            concepts: ["Recursion"],
            starterCode: `answer = 1 * 2 * 3 * 4 * 5`,
            variable: "answer",
            expected: "120",
            solution: `def factorial(n):
    if n == 1:
        return 1
    return n * factorial(n - 1)

answer = factorial(5)`,
            extraChecks: [
                codeRegexCheck("def\\s+factorial[\\s\\S]*factorial\\s*\\(", "Refined code should define factorial and call itself recursively.", `Use recursion:\ndef factorial(n):\n    if n == 1:\n        return 1\n    return n * factorial(n - 1)\n\nanswer = factorial(5)`),
                maxLinesCheck(7, "Refine the hard-coded multiplication into 7 or fewer non-empty recursive lines.", `One valid refined answer:\ndef factorial(n):\n    if n == 1:\n        return 1\n    return n * factorial(n - 1)\n\nanswer = factorial(5)`)
            ]
        }),
        makeLevelTask({
            id: "recursion-l5-debug",
            title: "Fix a missing recursive argument",
            objective: "The code cannot run because five is not defined. Repair it so answer finishes as 120.",
            taskType: "level-5-debug",
            concepts: ["Recursion"],
            starterCode: `def factorial(n):
    if n == 1:
        return 1
    return n * factorial(n - 1)

answer = factorial(five)`,
            variable: "answer",
            expected: "120",
            solution: `def factorial(n):
    if n == 1:
        return 1
    return n * factorial(n - 1)

answer = factorial(5)`,
            noErrorFix: "Use the number 5, not the undefined name five.",
            debug: {
                line: 6,
                cause: "five is treated as a variable name, but it has not been assigned.",
                fixHint: "Call factorial(5)."
            }
        })
    ],
    complex: [
        makeLevelTask({
            id: "complex-l1-blank",
            title: "Fill the search condition",
            objective: "Fill the condition and update expression that make the search store the matching index.",
            taskType: "level-1-blank",
            concepts: ["Loop", "Condition"],
            starterCode: `numbers = [5, 9, 12, 20]
target = 12
found_index = -1

for index in range(len(numbers)):
    if ___1___:
        found_index = ___2___
        break`,
            blanks: [
                { token: "___1___", label: "condition that detects the target" },
                { token: "___2___", label: "index value to store when found" }
            ],
            variable: "found_index",
            expected: "2",
            solution: `numbers = [5, 9, 12, 20]
target = 12
found_index = -1

for index in range(len(numbers)):
    if numbers[index] == target:
        found_index = index
        break`,
            functionHints: ["range", "len"]
        }),
        makeLevelTask({
            id: "complex-l2-line",
            title: "Write one search update line",
            objective: "Replace pass with one complete line that stores the current index.",
            taskType: "level-2-line",
            concepts: ["Loop", "Condition"],
            starterCode: `numbers = [5, 9, 12, 20]
target = 12
found_index = -1

for index in range(len(numbers)):
    if numbers[index] == target:
        pass
        break`,
            variable: "found_index",
            expected: "2",
            solution: `numbers = [5, 9, 12, 20]
target = 12
found_index = -1

for index in range(len(numbers)):
    if numbers[index] == target:
        found_index = index
        break`,
            functionHints: ["range", "len"]
        }),
        makeLevelTask({
            id: "complex-l3-block",
            title: "Write a complete search program",
            objective: "Write a complete linear-search program so found_index finishes as 2.",
            taskType: "level-3-program",
            concepts: ["Loop", "Condition"],
            starterCode: `# Write the complete program.
# Goal: find target 12 inside [5, 9, 12, 20].
pass`,
            variable: "found_index",
            expected: "2",
            solution: `numbers = [5, 9, 12, 20]
target = 12
found_index = -1

for index in range(len(numbers)):
    if numbers[index] == target:
        found_index = index
        break`,
            functionHints: ["range", "len"]
        }),
        makeLevelTask({
            id: "complex-l4-program",
            title: "Refine repeated search checks",
            objective: "The draft checks each index by hand. Refine it into a loop that uses len() to scan the list.",
            taskType: "level-4-refactor",
            concepts: ["Loop", "Condition"],
            starterCode: `numbers = [5, 9, 12, 20]
target = 12
found_index = -1
if numbers[0] == target:
    found_index = 0
if numbers[1] == target:
    found_index = 1
if numbers[2] == target:
    found_index = 2
if numbers[3] == target:
    found_index = 3`,
            variable: "found_index",
            expected: "2",
            solution: `numbers = [5, 9, 12, 20]
target = 12
found_index = -1
for index in range(len(numbers)):
    if numbers[index] == target:
        found_index = index
        break`,
            functionHints: ["range", "len"],
            extraChecks: [
                codeRegexCheck("\\bfor\\b[\\s\\S]*range\\s*\\(\\s*len\\s*\\(", "Refined search should use a loop with range(len(numbers)).", `Use the built-in len():\nfor index in range(len(numbers)):\n    if numbers[index] == target:\n        found_index = index\n        break`),
                maxLinesCheck(8, "Refine repeated search checks to 8 or fewer non-empty lines.", `One valid refined answer:\nnumbers = [5, 9, 12, 20]\ntarget = 12\nfound_index = -1\nfor index in range(len(numbers)):\n    if numbers[index] == target:\n        found_index = index\n        break`)
            ]
        }),
        makeLevelTask({
            id: "complex-l5-debug",
            title: "Fix a misspelled list name",
            objective: "The code cannot run because number is not the list. Repair it so found_index finishes as 2.",
            taskType: "level-5-debug",
            concepts: ["Loop", "Condition"],
            starterCode: `numbers = [5, 9, 12, 20]
target = 12
found_index = -1

for index in range(len(number)):
    if numbers[index] == target:
        found_index = index
        break`,
            variable: "found_index",
            expected: "2",
            solution: `numbers = [5, 9, 12, 20]
target = 12
found_index = -1

for index in range(len(numbers)):
    if numbers[index] == target:
        found_index = index
        break`,
            functionHints: ["range", "len"],
            noErrorFix: "Use len(numbers), not len(number). The built-in len() needs the list variable numbers.",
            debug: {
                line: 5,
                cause: "number is not defined; the list is named numbers.",
                fixHint: "Use the built-in len() with the correct list: range(len(numbers))."
            }
        })
    ]
};

function tagQuestionSet(tasks, setId, setTitle) {
    return tasks.map((task, index) => ({
        ...task,
        setId,
        setTitle,
        setOrder: Number(setId.replace("set-", "")) || 1,
        levelOrder: getTaskLevelNumber(task, index)
    }));
}

function buildPracticeTopicQuestionSets() {
    const output = {};
    Object.entries(REVISED_STUDENT_LEVEL_TASKS).forEach(([topicId, tasks]) => {
        output[topicId] = tagQuestionSet(tasks, "set-1", "Set 1");
    });

    const addSets = (topicId, builder, configs) => {
        configs.forEach((config, index) => {
            const setNumber = index + 2;
            output[topicId].push(...tagQuestionSet(builder(setNumber, config), `set-${setNumber}`, `Set ${setNumber}`));
        });
    };

    addSets("assignment", buildAssignmentQuestionSet, [
        { name: "city", value: "Paris", source: "home_city", copy: "display_city", a: "price", b: "tax", aValue: 18, bValue: 4, total: "total_cost", expected: "22" },
        { name: "pet_name", value: "Milo", source: "saved_pet", copy: "shown_pet", a: "width", b: "height", aValue: 7, bValue: 6, total: "area", expected: "42" },
        { name: "course_name", value: "Python", source: "chosen_course", copy: "label", a: "hours", b: "days", aValue: 3, bValue: 5, total: "study_minutes", expected: "15" },
        { name: "team_name", value: "Delta", source: "team", copy: "badge_text", a: "base", b: "bonus", aValue: 30, bValue: 12, total: "final_score", expected: "42" }
    ]);

    addSets("ifElse", buildIfElseQuestionSet, [
        { subject: "score", value: 91, threshold: 90, result: "grade", pass: "A", fail: "review" },
        { subject: "stock", value: 0, threshold: 1, result: "status", pass: "in stock", fail: "sold out", operator: "<" },
        { subject: "temperature", value: 12, threshold: 15, result: "coat", pass: "wear coat", fail: "no coat", operator: "<" },
        { subject: "age", value: 18, threshold: 18, result: "access", pass: "allowed", fail: "wait" }
    ]);

    addSets("forLoop", buildForLoopQuestionSet, [
        { end: 6, expectedLast: "5", totalEnd: 6, totalExpected: "15" },
        { end: 5, expectedLast: "4", totalEnd: 5, totalExpected: "10" },
        { end: 8, expectedLast: "7", totalEnd: 8, totalExpected: "28" },
        { end: 4, expectedLast: "3", totalEnd: 4, totalExpected: "6" }
    ]);

    addSets("whileLoop", buildWhileLoopQuestionSet, [
        { target: 4, totalLimit: 3, totalExpected: "6" },
        { target: 6, totalLimit: 5, totalExpected: "15" },
        { target: 3, totalLimit: 4, totalExpected: "10" },
        { target: 7, totalLimit: 6, totalExpected: "21" }
    ]);

    addSets("listTraversal", buildListTraversalQuestionSet, [
        { listName: "scores", items: [4, 9, 2], selected: "first_score", selectedValue: "4", largest: "9", count: "3", lastVar: "current_score" },
        { listName: "levels", items: [1, 3, 5, 7], selected: "first_level", selectedValue: "1", largest: "7", count: "4", lastVar: "current_level" },
        { listName: "weights", items: [6, 2, 8, 4], selected: "first_weight", selectedValue: "6", largest: "8", count: "4", lastVar: "current_weight" },
        { listName: "points", items: [10, 15, 5], selected: "first_point", selectedValue: "10", largest: "15", count: "3", lastVar: "current_point" }
    ]);

    addSets("accumulator", buildAccumulatorQuestionSet, [
        { listName: "prices", items: [5, 15, 20], totalVar: "total_price", expected: "40", words: ["sun", "moon"], lengthExpected: "7" },
        { listName: "scores", items: [12, 8, 10], totalVar: "score_total", expected: "30", words: ["red", "blue", "gold"], lengthExpected: "11" },
        { listName: "distances", items: [3, 4, 5], totalVar: "total_distance", expected: "12", words: ["hi", "code"], lengthExpected: "6" },
        { listName: "orders", items: [7, 9, 11], totalVar: "order_total", expected: "27", words: ["loop", "AI"], lengthExpected: "6" }
    ]);

    addSets("nestedLoop", buildNestedLoopQuestionSet, [
        { rows: ["A", "B", "C"], cols: [1, 2], expected: "6", grid: [[1, 2], [3, 4]], gridExpected: "10" },
        { rows: ["N", "S"], cols: [1, 2, 3, 4], expected: "8", grid: [[2, 2], [5, 1]], gridExpected: "10" },
        { rows: ["L", "R"], cols: [10, 20], expected: "4", grid: [[3, 6], [9, 12]], gridExpected: "30" },
        { rows: ["X", "Y", "Z"], cols: [5, 6, 7], expected: "9", grid: [[4, 1], [2, 8]], gridExpected: "15" }
    ]);

    addSets("functionCall", buildFunctionCallQuestionSet, [
        { functionName: "triple", input: 5, expected: "15", areaA: 3, areaB: 6, areaExpected: "18" },
        { functionName: "add_ten", input: 9, expected: "19", areaA: 2, areaB: 8, areaExpected: "16" },
        { functionName: "half", input: 20, expected: "10", areaA: 5, areaB: 5, areaExpected: "25" },
        { functionName: "minus_two", input: 14, expected: "12", areaA: 4, areaB: 7, areaExpected: "28" }
    ]);

    addSets("recursion", buildRecursionQuestionSet, [
        { factorialInput: 4, factorialExpected: "24", sumInput: 5, sumExpected: "15", powerBase: 3, powerExp: 2, powerExpected: "9" },
        { factorialInput: 6, factorialExpected: "720", sumInput: 3, sumExpected: "6", powerBase: 2, powerExp: 4, powerExpected: "16" },
        { factorialInput: 3, factorialExpected: "6", sumInput: 6, sumExpected: "21", powerBase: 4, powerExp: 2, powerExpected: "16" },
        { factorialInput: 5, factorialExpected: "120", sumInput: 7, sumExpected: "28", powerBase: 5, powerExp: 2, powerExpected: "25" }
    ]);

    addSets("complex", buildComplexQuestionSet, [
        { numbers: [3, 6, 9, 12], target: 9, expectedIndex: "2" },
        { numbers: [2, 8, 14, 20, 26], target: 20, expectedIndex: "3" },
        { numbers: [4, 7, 11, 18], target: 7, expectedIndex: "1" },
        { numbers: [10, 15, 21, 28, 36], target: 36, expectedIndex: "4" }
    ]);

    return output;
}

function buildAssignmentQuestionSet(setNumber, cfg) {
    const refactorSolution = `${cfg.name} = "${cfg.value}"\n${cfg.copy} = ${cfg.name}`;
    return [
        makeLevelTask({
            id: `assignment-s${setNumber}-l1`,
            title: `Assign ${cfg.value} from a source`,
            objective: `Fill the right-side expression so ${cfg.name} copies the prepared source value.`,
            taskType: "level-1-blank",
            concepts: ["Variable assignment"],
            starterCode: `${cfg.source} = "${cfg.value}"\n${cfg.name} = ___1___`,
            blanks: [{ token: "___1___", label: `expression that reads ${cfg.source}` }],
            variable: cfg.name,
            expected: cfg.value,
            solution: `${cfg.source} = "${cfg.value}"\n${cfg.name} = ${cfg.source}`
        }),
        makeLevelTask({
            id: `assignment-s${setNumber}-l2`,
            title: "Copy one variable",
            objective: `Replace pass with one complete line so ${cfg.copy} copies ${cfg.source}.`,
            taskType: "level-2-line",
            concepts: ["Variable assignment"],
            starterCode: `${cfg.source} = "${cfg.value}"\npass`,
            variable: cfg.copy,
            expected: cfg.value,
            solution: `${cfg.source} = "${cfg.value}"\n${cfg.copy} = ${cfg.source}`
        }),
        makeLevelTask({
            id: `assignment-s${setNumber}-l3`,
            title: "Write a complete calculation",
            objective: `Write the complete program so ${cfg.total} finishes as ${cfg.expected}.`,
            taskType: "level-3-program",
            concepts: ["Variable assignment"],
            starterCode: `# Write the complete program.\n# Goal: ${cfg.total} = ${cfg.a} + ${cfg.b}\npass`,
            variable: cfg.total,
            expected: cfg.expected,
            solution: `${cfg.a} = ${cfg.aValue}\n${cfg.b} = ${cfg.bValue}\n${cfg.total} = ${cfg.a} + ${cfg.b}`
        }),
        makeLevelTask({
            id: `assignment-s${setNumber}-l4`,
            title: "Refine repeated copies",
            objective: "The draft copies the same value through too many names. Keep the result but remove unnecessary copies.",
            taskType: "level-4-refactor",
            concepts: ["Variable assignment"],
            starterCode: `${cfg.name} = "${cfg.value}"\ncopy_one = ${cfg.name}\ncopy_two = copy_one\ncopy_three = copy_two\n${cfg.copy} = copy_three`,
            variable: cfg.copy,
            expected: cfg.value,
            solution: refactorSolution,
            extraChecks: [maxLinesCheck(3, "Refine repeated copies to 3 or fewer non-empty lines.", taskFix(refactorSolution))]
        }),
        makeLevelTask({
            id: `assignment-s${setNumber}-l5`,
            title: "Fix an undefined assignment value",
            objective: `The code cannot run because ${cfg.b} is missing. Repair it so ${cfg.total} finishes as ${cfg.expected}.`,
            taskType: "level-5-debug",
            concepts: ["Variable assignment"],
            starterCode: `${cfg.a} = ${cfg.aValue}\n${cfg.total} = ${cfg.a} + ${cfg.b}`,
            variable: cfg.total,
            expected: cfg.expected,
            solution: `${cfg.a} = ${cfg.aValue}\n${cfg.b} = ${cfg.bValue}\n${cfg.total} = ${cfg.a} + ${cfg.b}`,
            noErrorFix: `Define ${cfg.b} = ${cfg.bValue} before using it.`,
            debug: { line: 2, cause: `${cfg.b} is used before it is assigned.`, fixHint: `Add ${cfg.b} = ${cfg.bValue} before the calculation.` }
        })
    ];
}

function buildIfElseQuestionSet(setNumber, cfg) {
    const comparison = cfg.operator === "<" ? `${cfg.subject} < ${cfg.threshold}` : `${cfg.subject} >= ${cfg.threshold}`;
    const refactorSolution = `${cfg.subject} = ${cfg.value}\nif ${comparison}:\n    ${cfg.result} = "${cfg.pass}"\nelse:\n    ${cfg.result} = "${cfg.fail}"`;
    return [
        makeLevelTask({
            id: `ifelse-s${setNumber}-l1`,
            title: "Fill the branch condition",
            objective: `Fill the condition expression that chooses the ${cfg.pass} branch.`,
            taskType: "level-1-blank",
            concepts: ["Condition"],
            starterCode: `${cfg.subject} = ${cfg.value}\nif ___1___:\n    ${cfg.result} = "${cfg.pass}"\nelse:\n    ${cfg.result} = "${cfg.fail}"`,
            blanks: [{ token: "___1___", label: "condition expression for the true branch" }],
            variable: cfg.result,
            expected: cfg.pass,
            solution: refactorSolution
        }),
        makeLevelTask({
            id: `ifelse-s${setNumber}-l2`,
            title: "Write one branch line",
            objective: `Replace pass with one complete line in the true branch.`,
            taskType: "level-2-line",
            concepts: ["Condition"],
            starterCode: `${cfg.subject} = ${cfg.value}\nif ${comparison}:\n    pass\nelse:\n    ${cfg.result} = "${cfg.fail}"`,
            variable: cfg.result,
            expected: cfg.pass,
            solution: refactorSolution
        }),
        makeLevelTask({
            id: `ifelse-s${setNumber}-l3`,
            title: "Write a complete decision",
            objective: `Write a complete if/else program so ${cfg.result} finishes as ${cfg.pass}.`,
            taskType: "level-3-program",
            concepts: ["Condition"],
            starterCode: `# Write the complete if/else program.\npass`,
            variable: cfg.result,
            expected: cfg.pass,
            solution: refactorSolution
        }),
        makeLevelTask({
            id: `ifelse-s${setNumber}-l4`,
            title: "Refine repeated condition checks",
            objective: "The draft repeats separate if checks. Refine it into one clear if/else decision.",
            taskType: "level-4-refactor",
            concepts: ["Condition"],
            starterCode: `${cfg.subject} = ${cfg.value}\n${cfg.result} = "${cfg.fail}"\nif ${comparison}:\n    ${cfg.result} = "${cfg.pass}"\nif not (${comparison}):\n    ${cfg.result} = "${cfg.fail}"`,
            variable: cfg.result,
            expected: cfg.pass,
            solution: refactorSolution,
            extraChecks: [
                codeRegexCheck("\\belse\\b|\\belif\\b", "Refined condition should use else or elif.", taskFix(refactorSolution)),
                maxLinesCheck(6, "Refine repeated condition checks to 6 or fewer non-empty lines.", taskFix(refactorSolution))
            ]
        }),
        makeLevelTask({
            id: `ifelse-s${setNumber}-l5`,
            title: "Fix an undefined threshold",
            objective: "The code cannot run because limit is missing. Repair it and keep the same decision.",
            taskType: "level-5-debug",
            concepts: ["Condition"],
            starterCode: `${cfg.subject} = ${cfg.value}\nif ${cfg.subject} >= limit:\n    ${cfg.result} = "${cfg.pass}"\nelse:\n    ${cfg.result} = "${cfg.fail}"`,
            variable: cfg.result,
            expected: cfg.operator === "<" ? cfg.fail : cfg.pass,
            solution: `${cfg.subject} = ${cfg.value}\nlimit = ${cfg.threshold}\nif ${cfg.subject} >= limit:\n    ${cfg.result} = "${cfg.pass}"\nelse:\n    ${cfg.result} = "${cfg.fail}"`,
            noErrorFix: `Define limit = ${cfg.threshold} before the if statement.`,
            debug: { line: 2, cause: "limit is used before it is assigned.", fixHint: `Add limit = ${cfg.threshold} before the condition.` }
        })
    ];
}

function buildForLoopQuestionSet(setNumber, cfg) {
    const totalSolution = `total = 0\nfor number in range(1, ${cfg.totalEnd}):\n    total += number`;
    return [
        makeLevelTask({
            id: `for-s${setNumber}-l1`,
            title: "Fill the range expression",
            objective: "Fill the iterable expression that controls which numbers the loop visits.",
            taskType: "level-1-blank",
            concepts: ["Loop"],
            starterCode: `last_number = 0\nfor number in ___1___:\n    last_number = number`,
            blanks: [{ token: "___1___", label: `range expression that stops before ${cfg.end}` }],
            variable: "last_number",
            expected: cfg.expectedLast,
            solution: `last_number = 0\nfor number in range(1, ${cfg.end}):\n    last_number = number`,
            functionHints: ["range"]
        }),
        makeLevelTask({
            id: `for-s${setNumber}-l2`,
            title: "Write one loop update",
            objective: "Replace pass with one complete line that adds each number.",
            taskType: "level-2-line",
            concepts: ["Loop", "Accumulator"],
            starterCode: `total = 0\nfor number in range(1, ${cfg.totalEnd}):\n    pass`,
            variable: "total",
            expected: cfg.totalExpected,
            solution: totalSolution,
            functionHints: ["range"]
        }),
        makeLevelTask({
            id: `for-s${setNumber}-l3`,
            title: "Write a complete for-loop program",
            objective: `Write a complete program that makes total finish as ${cfg.totalExpected}.`,
            taskType: "level-3-program",
            concepts: ["Loop", "Accumulator"],
            starterCode: `# Write the complete program using for and range().\npass`,
            variable: "total",
            expected: cfg.totalExpected,
            solution: totalSolution,
            functionHints: ["range"]
        }),
        makeLevelTask({
            id: `for-s${setNumber}-l4`,
            title: "Refine repeated additions",
            objective: "The draft repeats the same addition pattern. Replace it with a for loop using range().",
            taskType: "level-4-refactor",
            concepts: ["Loop", "Accumulator"],
            starterCode: `total = 0\n${Array.from({ length: cfg.totalEnd - 1 }, (_, i) => `total += ${i + 1}`).join("\n")}`,
            variable: "total",
            expected: cfg.totalExpected,
            solution: totalSolution,
            functionHints: ["range"],
            extraChecks: [
                codeRegexCheck("\\bfor\\b[\\s\\S]*\\brange\\s*\\(", "Refined code should use for with range().", taskFix(totalSolution)),
                maxLinesCheck(4, "Refine repeated additions to 4 or fewer non-empty lines.", taskFix(totalSolution))
            ]
        }),
        makeLevelTask({
            id: `for-s${setNumber}-l5`,
            title: "Fix an undefined range stop",
            objective: "The code cannot run because stop_value is missing. Repair it.",
            taskType: "level-5-debug",
            concepts: ["Loop", "Accumulator"],
            starterCode: `total = 0\nfor number in range(1, stop_value):\n    total += number`,
            variable: "total",
            expected: cfg.totalExpected,
            solution: `total = 0\nstop_value = ${cfg.totalEnd}\nfor number in range(1, stop_value):\n    total += number`,
            functionHints: ["range"],
            noErrorFix: `Define stop_value = ${cfg.totalEnd} before range().`,
            debug: { line: 2, cause: "stop_value is used before it is assigned.", fixHint: `Add stop_value = ${cfg.totalEnd}, or use range(1, ${cfg.totalEnd}).` }
        })
    ];
}

function buildWhileLoopQuestionSet(setNumber, cfg) {
    const countSolution = `count = 0\nwhile count < ${cfg.target}:\n    count += 1`;
    const totalSolution = `number = 1\ntotal = 0\nwhile number <= ${cfg.totalLimit}:\n    total += number\n    number += 1`;
    return [
        makeLevelTask({ id: `while-s${setNumber}-l1`, title: "Fill the while condition", objective: "Fill the condition expression that keeps the loop running until the target count.", taskType: "level-1-blank", concepts: ["Loop"], starterCode: `count = 0\nwhile ___1___:\n    count += 1`, blanks: [{ token: "___1___", label: `condition that is true while count is below ${cfg.target}` }], variable: "count", expected: String(cfg.target), solution: countSolution }),
        makeLevelTask({ id: `while-s${setNumber}-l2`, title: "Write one while update", objective: "Replace pass with one complete line.", taskType: "level-2-line", concepts: ["Loop"], starterCode: `count = 0\nwhile count < ${cfg.target}:\n    pass`, variable: "count", expected: String(cfg.target), solution: countSolution }),
        makeLevelTask({ id: `while-s${setNumber}-l3`, title: "Write a complete while program", objective: `Write a complete while program so total finishes as ${cfg.totalExpected}.`, taskType: "level-3-program", concepts: ["Loop", "Accumulator"], starterCode: `# Write the complete program using while.\npass`, variable: "total", expected: cfg.totalExpected, solution: totalSolution }),
        makeLevelTask({ id: `while-s${setNumber}-l4`, title: "Refine repeated increments", objective: "Replace repeated increment lines with a while loop.", taskType: "level-4-refactor", concepts: ["Loop"], starterCode: `count = 0\n${Array.from({ length: cfg.target }, () => "count += 1").join("\n")}`, variable: "count", expected: String(cfg.target), solution: countSolution, extraChecks: [codeRegexCheck("\\bwhile\\b", "Refined code should use while.", taskFix(countSolution)), maxLinesCheck(4, "Refine repeated increments to 4 or fewer non-empty lines.", taskFix(countSolution))] }),
        makeLevelTask({ id: `while-s${setNumber}-l5`, title: "Fix an undefined loop target", objective: "The code cannot run because target is missing.", taskType: "level-5-debug", concepts: ["Loop"], starterCode: `count = 0\nwhile count < target:\n    count += 1`, variable: "count", expected: String(cfg.target), solution: `count = 0\ntarget = ${cfg.target}\nwhile count < target:\n    count += 1`, noErrorFix: `Define target = ${cfg.target} before the loop.`, debug: { line: 2, cause: "target is used before it is assigned.", fixHint: `Add target = ${cfg.target} before while.` } })
    ];
}

function buildListTraversalQuestionSet(setNumber, cfg) {
    const listLiteral = `[${cfg.items.join(", ")}]`;
    const largestSolution = `${cfg.listName} = ${listLiteral}\nlargest = 0\nfor number in ${cfg.listName}:\n    if number > largest:\n        largest = number`;
    const countSolution = `${cfg.listName} = ${listLiteral}\nitem_count = 0\nfor item in ${cfg.listName}:\n    item_count += 1`;
    const traversalSolution = `${cfg.listName} = ${listLiteral}\nfor item in ${cfg.listName}:\n    ${cfg.lastVar} = item`;
    return [
        makeLevelTask({ id: `list-s${setNumber}-l1`, title: "Fill the list access expression", objective: "Fill the expression that reads the first item from the list.", taskType: "level-1-blank", concepts: ["List / sequence"], starterCode: `${cfg.listName} = ${listLiteral}\n${cfg.selected} = ___1___`, blanks: [{ token: "___1___", label: `list access expression for the first ${cfg.listName} item` }], variable: cfg.selected, expected: cfg.selectedValue, solution: `${cfg.listName} = ${listLiteral}\n${cfg.selected} = ${cfg.listName}[0]` }),
        makeLevelTask({ id: `list-s${setNumber}-l2`, title: "Write one largest update", objective: "Replace pass with one complete line that updates largest.", taskType: "level-2-line", concepts: ["List traversal", "Condition"], starterCode: `${cfg.listName} = ${listLiteral}\nlargest = 0\nfor number in ${cfg.listName}:\n    if number > largest:\n        pass`, variable: "largest", expected: cfg.largest, solution: largestSolution }),
        makeLevelTask({ id: `list-s${setNumber}-l3`, title: "Write a complete list traversal", objective: "Write a complete traversal that counts the list items.", taskType: "level-3-program", concepts: ["List traversal", "Accumulator"], starterCode: `# Write the complete list traversal program.\npass`, variable: "item_count", expected: cfg.count, solution: countSolution }),
        makeLevelTask({ id: `list-s${setNumber}-l4`, title: "Refine repeated index access", objective: "Replace repeated index reads with a for traversal.", taskType: "level-4-refactor", concepts: ["List traversal", "Loop"], starterCode: `${cfg.listName} = ${listLiteral}\n${cfg.lastVar} = ${cfg.listName}[0]\n${cfg.lastVar} = ${cfg.listName}[1]\n${cfg.lastVar} = ${cfg.listName}[${cfg.items.length - 1}]`, variable: cfg.lastVar, expected: String(cfg.items[cfg.items.length - 1]), solution: traversalSolution, extraChecks: [codeRegexCheck(`\\bfor\\b[\\s\\S]*\\bin\\b[\\s\\S]*${cfg.listName}`, "Refined code should use a for traversal.", taskFix(traversalSolution)), maxLinesCheck(4, "Refine repeated index access to 4 or fewer non-empty lines.", taskFix(traversalSolution))] }),
        makeLevelTask({ id: `list-s${setNumber}-l5`, title: "Fix an out-of-range index", objective: "The code cannot run because the list index is out of range.", taskType: "level-5-debug", concepts: ["List / sequence"], starterCode: `${cfg.listName} = ${listLiteral}\n${cfg.selected} = ${cfg.listName}[${cfg.items.length}]`, variable: cfg.selected, expected: cfg.selectedValue, solution: `${cfg.listName} = ${listLiteral}\n${cfg.selected} = ${cfg.listName}[0]`, noErrorFix: `Use index 0 for the first item: ${cfg.selected} = ${cfg.listName}[0].`, debug: { line: 2, cause: "The index asks for an item past the end of the list.", fixHint: `Use ${cfg.listName}[0] for the first item.` } })
    ];
}

function buildAccumulatorQuestionSet(setNumber, cfg) {
    const listLiteral = `[${cfg.items.join(", ")}]`;
    const totalSolution = `${cfg.listName} = ${listLiteral}\n${cfg.totalVar} = 0\nfor item in ${cfg.listName}:\n    ${cfg.totalVar} += item`;
    const wordsLiteral = `[${cfg.words.map(word => `"${word}"`).join(", ")}]`;
    const lengthSolution = `words = ${wordsLiteral}\ntotal_length = 0\nfor word in words:\n    total_length += len(word)`;
    return [
        makeLevelTask({ id: `accumulator-s${setNumber}-l1`, title: "Fill the accumulator expression", objective: "Fill the expression that preserves the running total and adds the current item.", taskType: "level-1-blank", concepts: ["Accumulator"], starterCode: `${cfg.listName} = ${listLiteral}\n${cfg.totalVar} = 0\nfor item in ${cfg.listName}:\n    ${cfg.totalVar} = ___1___`, blanks: [{ token: "___1___", label: `expression using ${cfg.totalVar} and item` }], variable: cfg.totalVar, expected: cfg.expected, solution: totalSolution }),
        makeLevelTask({ id: `accumulator-s${setNumber}-l2`, title: "Write one accumulator line", objective: "Replace pass with one complete accumulator update.", taskType: "level-2-line", concepts: ["Accumulator"], starterCode: `${cfg.listName} = ${listLiteral}\n${cfg.totalVar} = 0\nfor item in ${cfg.listName}:\n    pass`, variable: cfg.totalVar, expected: cfg.expected, solution: totalSolution }),
        makeLevelTask({ id: `accumulator-s${setNumber}-l3`, title: "Write a complete len accumulator", objective: "Write a complete program that uses len() to total word lengths.", taskType: "level-3-program", concepts: ["Accumulator", "List traversal"], starterCode: `# Write the complete program using len().\npass`, variable: "total_length", expected: cfg.lengthExpected, solution: lengthSolution, functionHints: ["len"] }),
        makeLevelTask({ id: `accumulator-s${setNumber}-l4`, title: "Refine repeated additions", objective: "Replace repeated additions with a loop accumulator.", taskType: "level-4-refactor", concepts: ["Accumulator", "Loop"], starterCode: `${cfg.totalVar} = 0\n${cfg.items.map(value => `${cfg.totalVar} += ${value}`).join("\n")}`, variable: cfg.totalVar, expected: cfg.expected, solution: totalSolution, extraChecks: [codeRegexCheck("\\bfor\\b[\\s\\S]*\\+=", "Refined code should use a loop with +=.", taskFix(totalSolution)), maxLinesCheck(5, "Refine repeated additions to 5 or fewer non-empty lines.", taskFix(totalSolution))] }),
        makeLevelTask({ id: `accumulator-s${setNumber}-l5`, title: "Fix an uninitialized accumulator", objective: "The code cannot run because the accumulator is used before assignment.", taskType: "level-5-debug", concepts: ["Accumulator"], starterCode: `${cfg.listName} = ${listLiteral}\nfor item in ${cfg.listName}:\n    ${cfg.totalVar} += item`, variable: cfg.totalVar, expected: cfg.expected, solution: totalSolution, noErrorFix: `Initialize ${cfg.totalVar} = 0 before the loop.`, debug: { line: 3, cause: `${cfg.totalVar} is updated before it exists.`, fixHint: `Add ${cfg.totalVar} = 0 before the loop.` } })
    ];
}

function buildNestedLoopQuestionSet(setNumber, cfg) {
    const rowsLiteral = `[${cfg.rows.map(row => `"${row}"`).join(", ")}]`;
    const colsLiteral = `[${cfg.cols.join(", ")}]`;
    const pairSolution = `rows = ${rowsLiteral}\ncols = ${colsLiteral}\npair_count = 0\nfor row in rows:\n    for col in cols:\n        pair_count += 1`;
    const gridLiteral = `[${cfg.grid.map(row => `[${row.join(", ")}]`).join(", ")}]`;
    const gridSolution = `grid = ${gridLiteral}\ngrid_total = 0\nfor row in grid:\n    for value in row:\n        grid_total += value`;
    return [
        makeLevelTask({ id: `nested-s${setNumber}-l1`, title: "Fill the nested counter expression", objective: "Fill the expression that counts one pair each time the inner loop runs.", taskType: "level-1-blank", concepts: ["Nested loop"], starterCode: `pair_count = 0\nrows = ${rowsLiteral}\ncols = ${colsLiteral}\nfor row in rows:\n    for col in cols:\n        pair_count = ___1___`, blanks: [{ token: "___1___", label: "counter expression that adds one pair" }], variable: "pair_count", expected: cfg.expected, solution: pairSolution }),
        makeLevelTask({ id: `nested-s${setNumber}-l2`, title: "Write one inner-loop line", objective: "Replace pass with one complete line inside the inner loop.", taskType: "level-2-line", concepts: ["Nested loop", "Accumulator"], starterCode: `rows = ${rowsLiteral}\ncols = ${colsLiteral}\npair_count = 0\nfor row in rows:\n    for col in cols:\n        pass`, variable: "pair_count", expected: cfg.expected, solution: pairSolution }),
        makeLevelTask({ id: `nested-s${setNumber}-l3`, title: "Write a complete grid total", objective: "Write a complete nested-loop program that totals every value.", taskType: "level-3-program", concepts: ["Nested loop", "Accumulator"], starterCode: `# Write the complete nested-loop program.\npass`, variable: "grid_total", expected: cfg.gridExpected, solution: gridSolution }),
        makeLevelTask({ id: `nested-s${setNumber}-l4`, title: "Refine repeated pair counts", objective: "Replace repeated pair-count lines with nested loops.", taskType: "level-4-refactor", concepts: ["Nested loop", "Accumulator"], starterCode: `pair_count = 0\n${Array.from({ length: Number(cfg.expected) }, () => "pair_count += 1").join("\n")}`, variable: "pair_count", expected: cfg.expected, solution: pairSolution, extraChecks: [codeRegexCheck("\\bfor\\b[\\s\\S]*\\bfor\\b", "Refined code should use nested for loops.", taskFix(pairSolution)), maxLinesCheck(7, "Refine repeated pair counts to 7 or fewer non-empty lines.", taskFix(pairSolution))] }),
        makeLevelTask({ id: `nested-s${setNumber}-l5`, title: "Fix a misspelled inner-loop source", objective: "The code cannot run because roww is not defined.", taskType: "level-5-debug", concepts: ["Nested loop"], starterCode: `grid = ${gridLiteral}\ngrid_total = 0\nfor row in grid:\n    for value in roww:\n        grid_total += value`, variable: "grid_total", expected: cfg.gridExpected, solution: gridSolution, noErrorFix: "Use row, not roww, inside the inner loop.", debug: { line: 4, cause: "roww is a typo; the outer loop variable is row.", fixHint: "Change roww to row." } })
    ];
}

function buildFunctionCallQuestionSet(setNumber, cfg) {
    const functionBody = cfg.functionName === "triple" ? "return number * 3" : cfg.functionName === "add_ten" ? "return number + 10" : cfg.functionName === "half" ? "return number // 2" : "return number - 2";
    const simpleSolution = `def ${cfg.functionName}(number):\n    ${functionBody}\n\nanswer = ${cfg.functionName}(${cfg.input})`;
    const areaSolution = `def rectangle_area(width, height):\n    return width * height\n\narea = rectangle_area(${cfg.areaA}, ${cfg.areaB})`;
    return [
        makeLevelTask({ id: `function-s${setNumber}-l1`, title: "Fill the function call", objective: "Fill the call expression that stores the function result in answer.", taskType: "level-1-blank", concepts: ["Function call"], starterCode: `def ${cfg.functionName}(number):\n    ${functionBody}\n\nanswer = ___1___`, blanks: [{ token: "___1___", label: `function call using ${cfg.functionName}` }], variable: "answer", expected: cfg.expected, solution: simpleSolution }),
        makeLevelTask({ id: `function-s${setNumber}-l2`, title: "Write one return line", objective: "Replace pass with one complete return line.", taskType: "level-2-line", concepts: ["Function call"], starterCode: `def ${cfg.functionName}(number):\n    pass\n\nanswer = ${cfg.functionName}(${cfg.input})`, variable: "answer", expected: cfg.expected, solution: simpleSolution }),
        makeLevelTask({ id: `function-s${setNumber}-l3`, title: "Write a complete function program", objective: "Write a complete function program that computes area.", taskType: "level-3-program", concepts: ["Function call"], starterCode: `# Write the complete function program.\npass`, variable: "area", expected: cfg.areaExpected, solution: areaSolution }),
        makeLevelTask({ id: `function-s${setNumber}-l4`, title: "Refine repeated calculations into a function", objective: "Replace repeated rectangle area calculations with a reusable function.", taskType: "level-4-refactor", concepts: ["Function call"], starterCode: `width = ${cfg.areaA}\nheight = ${cfg.areaB}\narea_one = width * height\narea_two = width * height\narea = area_two`, variable: "area", expected: cfg.areaExpected, solution: areaSolution, extraChecks: [codeRegexCheck("\\bdef\\b[\\s\\S]*\\barea\\s*=", "Refined code should define a function and call it.", taskFix(areaSolution)), maxLinesCheck(5, "Refine repeated calculations to 5 or fewer non-empty lines.", taskFix(areaSolution))] }),
        makeLevelTask({ id: `function-s${setNumber}-l5`, title: "Fix a misspelled function call", objective: "The code cannot run because the function call is misspelled.", taskType: "level-5-debug", concepts: ["Function call"], starterCode: `def ${cfg.functionName}(number):\n    ${functionBody}\n\nanswer = ${cfg.functionName}x(${cfg.input})`, variable: "answer", expected: cfg.expected, solution: simpleSolution, noErrorFix: `Call ${cfg.functionName}(${cfg.input}), not ${cfg.functionName}x(${cfg.input}).`, debug: { line: 4, cause: `The function is named ${cfg.functionName}, not ${cfg.functionName}x.`, fixHint: `Change the call to ${cfg.functionName}(${cfg.input}).` } })
    ];
}

function buildRecursionQuestionSet(setNumber, cfg) {
    const factorialSolution = `def factorial(n):\n    if n == 1:\n        return 1\n    return n * factorial(n - 1)\n\nanswer = factorial(${cfg.factorialInput})`;
    const sumSolution = `def sum_to(n):\n    if n == 1:\n        return 1\n    return n + sum_to(n - 1)\n\nanswer = sum_to(${cfg.sumInput})`;
    const powerSolution = `def power(base, exponent):\n    if exponent == 0:\n        return 1\n    return base * power(base, exponent - 1)\n\nresult = power(${cfg.powerBase}, ${cfg.powerExp})`;
    return [
        makeLevelTask({ id: `recursion-s${setNumber}-l1`, title: "Fill the recursive call", objective: "Fill the smaller recursive call used to finish factorial.", taskType: "level-1-blank", concepts: ["Recursion"], starterCode: `def factorial(n):\n    if n == 1:\n        return 1\n    return n * ___1___\n\nanswer = factorial(${cfg.factorialInput})`, blanks: [{ token: "___1___", label: "recursive call on the smaller problem" }], variable: "answer", expected: cfg.factorialExpected, solution: factorialSolution }),
        makeLevelTask({ id: `recursion-s${setNumber}-l2`, title: "Write one recursive return", objective: "Replace pass with one complete recursive return line.", taskType: "level-2-line", concepts: ["Recursion"], starterCode: `def sum_to(n):\n    if n == 1:\n        return 1\n    pass\n\nanswer = sum_to(${cfg.sumInput})`, variable: "answer", expected: cfg.sumExpected, solution: sumSolution }),
        makeLevelTask({ id: `recursion-s${setNumber}-l3`, title: "Write a complete recursive program", objective: "Write a complete recursive power program.", taskType: "level-3-program", concepts: ["Recursion"], starterCode: `# Write the complete recursive program.\npass`, variable: "result", expected: cfg.powerExpected, solution: powerSolution }),
        makeLevelTask({ id: `recursion-s${setNumber}-l4`, title: "Refine hard-coded multiplication into recursion", objective: "Replace hard-coded factorial multiplication with recursion.", taskType: "level-4-refactor", concepts: ["Recursion"], starterCode: `answer = ${Array.from({ length: cfg.factorialInput }, (_, i) => i + 1).join(" * ")}`, variable: "answer", expected: cfg.factorialExpected, solution: factorialSolution, extraChecks: [codeRegexCheck("def\\s+factorial[\\s\\S]*factorial\\s*\\(", "Refined code should define factorial and call itself recursively.", taskFix(factorialSolution)), maxLinesCheck(7, "Refine the hard-coded multiplication into 7 or fewer recursive lines.", taskFix(factorialSolution))] }),
        makeLevelTask({ id: `recursion-s${setNumber}-l5`, title: "Fix an undefined recursive argument", objective: "The code cannot run because amount is not defined.", taskType: "level-5-debug", concepts: ["Recursion"], starterCode: `def factorial(n):\n    if n == 1:\n        return 1\n    return n * factorial(n - 1)\n\nanswer = factorial(amount)`, variable: "answer", expected: cfg.factorialExpected, solution: factorialSolution, noErrorFix: `Call factorial(${cfg.factorialInput}), or define amount = ${cfg.factorialInput}.`, debug: { line: 6, cause: "amount is used as a variable but has not been assigned.", fixHint: `Use factorial(${cfg.factorialInput}).` } })
    ];
}

function buildComplexQuestionSet(setNumber, cfg) {
    const nums = `[${cfg.numbers.join(", ")}]`;
    const searchSolution = `numbers = ${nums}\ntarget = ${cfg.target}\nfound_index = -1\n\nfor index in range(len(numbers)):\n    if numbers[index] == target:\n        found_index = index\n        break`;
    return [
        makeLevelTask({ id: `complex-s${setNumber}-l1`, title: "Fill the search condition", objective: "Fill the condition and update expression that make the search store the matching index.", taskType: "level-1-blank", concepts: ["Loop", "Condition"], starterCode: `numbers = ${nums}\ntarget = ${cfg.target}\nfound_index = -1\nfor index in range(len(numbers)):\n    if ___1___:\n        found_index = ___2___\n        break`, blanks: [{ token: "___1___", label: "condition that detects the target" }, { token: "___2___", label: "index value to store when found" }], variable: "found_index", expected: cfg.expectedIndex, solution: searchSolution, functionHints: ["range", "len"] }),
        makeLevelTask({ id: `complex-s${setNumber}-l2`, title: "Write one search update", objective: "Replace pass with the line that stores the current index.", taskType: "level-2-line", concepts: ["Loop", "Condition"], starterCode: `numbers = ${nums}\ntarget = ${cfg.target}\nfound_index = -1\nfor index in range(len(numbers)):\n    if numbers[index] == target:\n        pass\n        break`, variable: "found_index", expected: cfg.expectedIndex, solution: searchSolution, functionHints: ["range", "len"] }),
        makeLevelTask({ id: `complex-s${setNumber}-l3`, title: "Write a complete linear search", objective: "Write a complete linear search program.", taskType: "level-3-program", concepts: ["Loop", "Condition"], starterCode: `# Write the complete linear search program.\npass`, variable: "found_index", expected: cfg.expectedIndex, solution: searchSolution, functionHints: ["range", "len"] }),
        makeLevelTask({ id: `complex-s${setNumber}-l4`, title: "Refine repeated search checks", objective: "Replace repeated index checks with a loop using len().", taskType: "level-4-refactor", concepts: ["Loop", "Condition"], starterCode: `numbers = ${nums}\ntarget = ${cfg.target}\nfound_index = -1\n${cfg.numbers.map((_, index) => `if numbers[${index}] == target:\n    found_index = ${index}`).join("\n")}`, variable: "found_index", expected: cfg.expectedIndex, solution: searchSolution, functionHints: ["range", "len"], extraChecks: [codeRegexCheck("\\bfor\\b[\\s\\S]*range\\s*\\(\\s*len\\s*\\(", "Refined search should use range(len(numbers)).", taskFix(searchSolution)), maxLinesCheck(8, "Refine repeated search checks to 8 or fewer non-empty lines.", taskFix(searchSolution))] }),
        makeLevelTask({ id: `complex-s${setNumber}-l5`, title: "Fix a misspelled list name", objective: "The code cannot run because number is not the list variable.", taskType: "level-5-debug", concepts: ["Loop", "Condition"], starterCode: `numbers = ${nums}\ntarget = ${cfg.target}\nfound_index = -1\nfor index in range(len(number)):\n    if numbers[index] == target:\n        found_index = index\n        break`, variable: "found_index", expected: cfg.expectedIndex, solution: searchSolution, functionHints: ["range", "len"], noErrorFix: "Use len(numbers), not len(number).", debug: { line: 4, cause: "number is not defined; the list is named numbers.", fixHint: "Use range(len(numbers))." } })
    ];
}

Object.assign(STUDENT_LEVEL_TASKS, buildPracticeTopicQuestionSets());

const TOPIC_LEVEL_PATHS = Object.fromEntries(
    Object.entries(STUDENT_LEVEL_TASKS).map(([topicId, tasks]) => [topicId, tasks.map(task => task.id)])
);

const WALKTHROUGH_DEMOS = {
    mission: {
        topicId: "accumulator",
        taskId: "sum-three",
        solutionCode: `total_sum = 0
numbers = [10, 20, 30]

for number in numbers:
    total_sum += number`,
        summary: "The walkthrough opens Level 1, fixes the accumulator, runs it, and shows the auto-check feedback.",
        steps: ["Open Level 1", "Replace the broken accumulator update", "Run the trace", "Read the pass/fail feedback"]
    },
    prediction: {
        topicId: "accumulator",
        taskId: "sum-three",
        solutionCode: `total_sum = 0
numbers = [10, 20, 30]

for number in numbers:
    total_sum += number`,
        summary: "The walkthrough runs the trace, predicts the first changed variable value, and checks the answer.",
        steps: ["Run the corrected code", "Pause on the first trace step", "Fill the predicted value", "Check the prediction"]
    },
    debug: {
        topicId: "accumulator",
        taskId: "sum-three",
        solutionCode: `total_sum = 0
numbers = [10, 20, 30]

for number in numbers:
    total_sum += number`,
        bugLine: 5,
        bugReason: "Line 5 overwrites total_sum with one number, so it forgets the earlier loop values.",
        summary: "The walkthrough reports the bug line, explains the state problem, fixes the code, and runs the trace.",
        steps: ["Select the suspicious line", "Write the bug explanation", "Submit the bug report", "Fix and run the code"]
    },
    aiReview: {
        topicId: "accumulator",
        taskId: "sum-three",
        solutionCode: `total_sum = 0
numbers = [10, 20, 30]

for number in numbers:
    total_sum += number`,
        summary: "The walkthrough selects the correct review concerns, fixes the AI-style draft, and verifies the result.",
        steps: ["Select the real review concerns", "Submit the AI review", "Improve the code", "Run the trace as evidence"]
    },
    skillTree: {
        topicId: "accumulator",
        taskId: "sum-three",
        solutionCode: `total_sum = 0
numbers = [10, 20, 30]

for number in numbers:
    total_sum += number`,
        summary: "The walkthrough completes one task so the growth map has progress to display.",
        steps: ["Open the growth map", "Complete one trace task", "Update skill progress", "Inspect the progress bars"]
    }
};

const btnRun = document.getElementById('btn-run');
const btnOpenGuide = document.getElementById('btn-open-guide');
const slider = document.getElementById('trace-slider');
const consoleOutput = document.getElementById('console-output');
const scopeGrid = document.getElementById('scope-grid');
const variablesBox = document.getElementById('variables-box');
const traceLayout = document.getElementById('trace-layout');
const stepCounter = document.getElementById('step-counter');
const conceptPanel = document.getElementById('concept-panel');
const exampleSelect = document.getElementById('example-select');
const lessonSelect = document.getElementById('lesson-select');
const modeSelect = document.getElementById('mode-select');
const modeContext = document.getElementById('mode-context');
const btnResetView = document.getElementById('btn-reset-view');
const btnCheckLesson = document.getElementById('btn-check-lesson');
const lessonGoal = document.getElementById('lesson-goal');
const lessonStatus = document.getElementById('lesson-status');
const exercisePanelTitle = document.getElementById('exercise-panel-title');
const teacherInsights = document.getElementById('teacher-insights');
const btnPracticeView = document.getElementById('btn-practice-view');
const btnDashboardView = document.getElementById('btn-dashboard-view');
const btnQuestionBankView = document.getElementById('btn-question-bank-view');
const dashboardSummary = document.getElementById('dashboard-summary');
const dashboardSkillCloud = document.getElementById('dashboard-skill-cloud');
const dashboardTopicTable = document.getElementById('dashboard-topic-table');
const questionBankContent = document.getElementById('question-bank-content');
const btnExportReport = document.getElementById('btn-export-report');
const exportReportMenu = document.getElementById('export-report-menu');
const reportScopeSelect = document.getElementById('report-scope-select');
const btnReportPrint = document.getElementById('btn-report-print');
const btnReportHtml = document.getElementById('btn-report-html');
const btnPresentationMode = document.getElementById('btn-presentation-mode');
const predictionLab = document.getElementById('prediction-lab');
const predictionPrompt = document.getElementById('prediction-prompt');
const predictionInput = document.getElementById('prediction-input');
const predictionFeedback = document.getElementById('prediction-feedback');
const btnCheckPrediction = document.getElementById('btn-check-prediction');
const btnRevealAnswer = document.getElementById('btn-reveal-answer');
const guideOverlay = document.getElementById('guide-overlay');
const guideCard = document.getElementById('guide-card');
const guideTitle = document.getElementById('guide-title');
const guideBody = document.getElementById('guide-body');
const guideStep = document.getElementById('guide-step');
const btnGuideNext = document.getElementById('btn-guide-next');
const btnGuidePrev = document.getElementById('btn-guide-prev');
const btnGuideSkip = document.getElementById('btn-guide-skip');

const codeInput = document.getElementById('code-input');
const codeViewer = document.getElementById('code-viewer');
const gutterZone = document.getElementById('gutter-zone');
const editorTitle = document.getElementById('editor-title');
const workspaceBody = document.getElementById('workspace-body');
const blankSlot = document.getElementById('blank-slot');
const topicBrief = document.getElementById('topic-brief');
const algorithmIntro = document.getElementById('algorithm-intro');
const topicCompleteOverlay = document.getElementById('topic-complete-overlay');
const topicCompleteTitle = document.getElementById('topic-complete-title');
const topicCompleteBody = document.getElementById('topic-complete-body');
const btnTopicRefresh = document.getElementById('btn-topic-refresh');
const btnTopicRepeat = document.getElementById('btn-topic-repeat');

const GUIDE_STEPS = [
    {
        title: "1. Choose a topic",
        body: "Choose the programming topic you want to practice. The app will load the next unfinished level for that topic.",
        focus: "#lesson-select",
        placement: "bottom"
    },
    {
        title: "2. Understand the path",
        body: "This strip explains the practice flow. Code is controlled by the active Level card, so the level you choose is the task you edit.",
        focus: "#mode-context",
        placement: "bottom"
    },
    {
        title: "3. Read the current level",
        body: "The current level tells you the goal, what type of task it is, and whether it is already complete.",
        focus: "#lesson-goal",
        placement: "left"
    },
    {
        title: "4. Edit the code",
        body: "Change only what the current level asks for. The active level is the task that Code is trying to solve.",
        focus: "#code-input",
        placement: "right"
    },
    {
        title: "5. Run the code",
        body: "Use Compile & Run from the code panel when the code is ready.",
        focus: "#btn-run",
        placement: "bottom"
    },
    {
        title: "6. Read the feedback",
        body: "After the run, the current level tells you whether it passed. If it failed, use Show fix on the failed item.",
        focus: "#lesson-goal",
        placement: "left"
    },
    {
        title: "7. Move through the run",
        body: "Drag the timeline to inspect each executed step.",
        focus: "#trace-slider",
        placement: "top"
    },
    {
        title: "8. Read evidence",
        body: "The bottom display shows variable values and the explanation for the selected step.",
        focus: "#timeline-panel",
        placement: "top"
    },
    {
        title: "9. Check growth",
        body: "Open Dashboard to see topic progress, completed levels, and the skills that have been trained.",
        focus: "#btn-dashboard-view",
        placement: "bottom"
    }
];

let guideIndex = 0;

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderInitialConsole() {
    consoleOutput.innerHTML = `
        <div class="console-row muted">Run the code to see the explanation for each executed step.</div>
    `;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeValue(value) {
    return String(value ?? '').trim();
}

function getQuestionBankForTopic(topicId) {
    return STUDENT_LEVEL_TASKS[topicId] || PRACTICE_TASKS[topicId] || [];
}

function getTasksForTopic(topicId) {
    const bank = getQuestionBankForTopic(topicId);
    const selectedIds = getTopicBatch(topicId).taskIds;
    const taskMap = new Map(bank.map(task => [task.id, task]));
    const selected = selectedIds.map(taskId => taskMap.get(taskId)).filter(Boolean);
    return selected.length ? selected : getDefaultBatchTaskIds(topicId).map(taskId => taskMap.get(taskId)).filter(Boolean);
}

function getTaskKey(topicId, taskId) {
    return `${topicId}:${taskId}`;
}

function getCompletionKey(topicId, taskId, batchId = getTopicBatch(topicId).batchId) {
    return `${topicId}:${batchId}:${taskId}`;
}

function getTopicBatches() {
    return readJsonStorage(TOPIC_BATCH_KEY, {});
}

function writeTopicBatches(batches) {
    writeJsonStorage(TOPIC_BATCH_KEY, batches);
}

function getTopicBatch(topicId) {
    const batches = getTopicBatches();
    if (batches[topicId]?.taskIds?.length && isValidTopicBatch(topicId, batches[topicId])) return batches[topicId];

    const firstSet = getNextQuestionSetForTopic(topicId);
    const batch = {
        batchId: firstSet?.setId || "set-1",
        setId: firstSet?.setId || "set-1",
        setTitle: firstSet?.setTitle || "Set 1",
        taskIds: firstSet?.taskIds || getDefaultBatchTaskIds(topicId),
        refreshedAt: null
    };
    batches[topicId] = batch;
    writeTopicBatches(batches);
    return batch;
}

function isValidTopicBatch(topicId, batch) {
    const bankIds = new Set(getQuestionBankForTopic(topicId).map(task => task.id));
    return (batch.taskIds || []).every(taskId => bankIds.has(taskId));
}

function getQuestionSetsForTopic(topicId) {
    const sets = new Map();
    getQuestionBankForTopic(topicId).forEach((task, index) => {
        const setId = task.setId || "set-1";
        if (!sets.has(setId)) {
            sets.set(setId, {
                setId,
                setTitle: task.setTitle || `Set ${sets.size + 1}`,
                setOrder: task.setOrder || sets.size + 1,
                tasks: []
            });
        }
        sets.get(setId).tasks.push(task);
    });

    return [...sets.values()]
        .map(set => ({
            ...set,
            tasks: set.tasks.slice().sort((a, b) => getTaskLevelNumber(a) - getTaskLevelNumber(b)),
            taskIds: set.tasks.slice().sort((a, b) => getTaskLevelNumber(a) - getTaskLevelNumber(b)).map(task => task.id)
        }))
        .sort((a, b) => a.setOrder - b.setOrder || a.setId.localeCompare(b.setId));
}

function isQuestionSetCompleted(topicId, questionSet, completed = getCompletedMissions()) {
    return questionSet?.tasks?.length
        ? questionSet.tasks.every(task => completed.has(getCompletionKey(topicId, task.id, questionSet.setId)))
        : false;
}

function getNextQuestionSetForTopic(topicId, previousBatch = null, completed = getCompletedMissions()) {
    const sets = getQuestionSetsForTopic(topicId);
    if (!sets.length) return null;

    const previousSetId = previousBatch?.setId || previousBatch?.sourceSetId || sets[sets.length - 1].setId;
    const previousIndex = Math.max(0, sets.findIndex(set => set.setId === previousSetId));

    if (!previousBatch) {
        const firstIncompleteSet = sets.find(set => !isQuestionSetCompleted(topicId, set, completed));
        if (firstIncompleteSet) return firstIncompleteSet;
    } else {
        for (let offset = 1; offset <= sets.length; offset += 1) {
            const candidate = sets[(previousIndex + offset) % sets.length];
            if (!isQuestionSetCompleted(topicId, candidate, completed)) return candidate;
        }
    }

    return sets[(previousIndex + 1) % sets.length];
}

function makeBatchFromQuestionSet(topicId, questionSet, options = {}) {
    const completed = options.completed || getCompletedMissions();
    const isReview = options.review === true || isQuestionSetCompleted(topicId, questionSet, completed);
    const batchId = isReview
        ? `review-${Date.now()}-${questionSet.setId}`
        : questionSet.setId;
    return {
        batchId,
        setId: questionSet.setId,
        sourceSetId: questionSet.setId,
        setTitle: questionSet.setTitle,
        taskIds: questionSet.taskIds,
        refreshedAt: new Date().toISOString(),
        review: isReview
    };
}

function getDefaultBatchTaskIds(topicId) {
    const firstSet = getQuestionSetsForTopic(topicId)[0];
    if (firstSet?.taskIds?.length) return firstSet.taskIds;
    return getLevelGroupsForTopic(topicId).map(group => group.tasks[0]?.id).filter(Boolean);
}

function getLevelGroupsForTopic(topicId) {
    const groups = new Map();
    getQuestionBankForTopic(topicId).forEach((task, index) => {
        const levelNumber = getTaskLevelNumber(task, index);
        if (!groups.has(levelNumber)) {
            groups.set(levelNumber, {
                level: levelNumber,
                stage: LEVEL_STAGE_LABELS[levelNumber - 1] || `Level ${levelNumber}`,
                tasks: []
            });
        }
        groups.get(levelNumber).tasks.push(task);
    });
    return [...groups.values()].sort((a, b) => a.level - b.level);
}

function refreshTopicBatch(topicId) {
    const batches = getTopicBatches();
    const previous = getTopicBatch(topicId);
    const completed = getCompletedMissions();
    const nextSet = getNextQuestionSetForTopic(topicId, previous, completed);
    if (!nextSet) return previous;

    const allSetsComplete = getQuestionSetsForTopic(topicId)
        .every(set => isQuestionSetCompleted(topicId, set, completed));
    batches[topicId] = makeBatchFromQuestionSet(topicId, nextSet, {
        completed,
        review: allSetsComplete
    });
    writeTopicBatches(batches);
    return batches[topicId];
}

function isMissionCompleted(mission, completed = getCompletedMissions()) {
    if (!mission) return false;
    const batchId = mission.batchId || getTopicBatch(mission.topicId).batchId;
    return completed.has(getCompletionKey(mission.topicId, mission.taskId, batchId))
        || (batchId === "default" && completed.has(getTaskKey(mission.topicId, mission.taskId)));
}

function isTaskCompletedInCurrentBatch(topicId, taskId, completed = getCompletedMissions()) {
    return isMissionCompleted({ topicId, taskId, batchId: getTopicBatch(topicId).batchId }, completed);
}

function isTaskInCurrentBatch(topicId, taskId) {
    return getTopicBatch(topicId).taskIds.includes(taskId);
}

function getActiveTask() {
    const tasks = getTasksForTopic(activeLessonId);
    return tasks.find(task => task.id === activeTaskId) || tasks[0] || null;
}

function isBlankTask(task = getActiveTask()) {
    return Boolean(task?.blanks?.length);
}

function getBlankValue(token) {
    return blankDraftValues[token] || "";
}

function renderCodeWithBlankValues(task = getActiveTask()) {
    if (!isBlankTask(task)) return task?.starterCode || "";

    return task.blanks.reduce((code, blank) => {
        const value = getBlankValue(blank.token).trim();
        return code.split(blank.token).join(value || blank.token);
    }, task.starterCode);
}

function syncBlankInputsToCode(task = getActiveTask()) {
    if (!isBlankTask(task)) return;
    codeInput.value = renderCodeWithBlankValues(task);
    syncEditorRendering();
    updateRunAvailability();
}

function getTaskMeta(task = getActiveTask(), topicId = activeLessonId) {
    if (!task) return {};

    const enrichment = TASK_ENRICHMENTS[getTaskKey(topicId, task.id)] || {};
    const conceptSkills = (task.concepts || [LESSONS[topicId]?.concept || "tracing"])
        .map(concept => CONCEPT_SKILL_MAP[concept] || "tracing");
    const skills = [...new Set([...(task.skills || []), ...(enrichment.skills || []), ...conceptSkills, "tracing"])];

    return {
        story: task.story || enrichment.story || `Trace this ${LESSONS[topicId]?.title || "programming"} task and use the result as evidence.`,
        missionOrder: enrichment.missionOrder || null,
        skills,
        debug: task.debug || enrichment.debug || null,
        aiReview: enrichment.aiReview || null
    };
}

function readJsonStorage(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
        return fallback;
    }
}

function writeJsonStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getCompletedMissions() {
    return new Set(readJsonStorage(MISSION_PROGRESS_KEY, []));
}

function markMissionCompleted(topicId, taskId) {
    const completed = getCompletedMissions();
    completed.add(getCompletionKey(topicId, taskId));
    writeJsonStorage(MISSION_PROGRESS_KEY, [...completed]);
}

function getSkillProgress() {
    const stored = readJsonStorage(SKILL_PROGRESS_KEY, {});
    return SKILL_DEFINITIONS.reduce((progress, skill) => {
        progress[skill.id] = Math.max(0, Math.min(100, Number(stored[skill.id] || 0)));
        return progress;
    }, {});
}

function updateSkillProgressForTask(task, result) {
    if (!task || !result?.passed) return;

    const progress = getSkillProgress();
    const skills = getTaskMeta(task).skills || [];
    skills.forEach(skillId => {
        progress[skillId] = Math.min(100, (progress[skillId] || 0) + 12);
    });
    writeJsonStorage(SKILL_PROGRESS_KEY, progress);
}

function resetModeInteractionState() {
    selectedBugLine = null;
    debugReportFeedback = null;
    reviewSelections = new Set();
    reviewFeedback = null;
    revealedMissionFixes = new Set();
}

function clearWalkthroughState() {
    activeWalkthroughMode = null;
    walkthroughFeedback = null;
}

function logStudentAction(actionType, label, details = {}) {
    const task = getActiveTask();
    studentActionLog.push({
        timestamp: new Date().toISOString(),
        actionType,
        label,
        topicId: activeLessonId,
        topicTitle: LESSONS[activeLessonId]?.title || "",
        taskId: task?.id || "",
        taskTitle: task?.title || "",
        contentMode: activeContentMode,
        stepIndex: pipelineSteps.length ? currentFrameIndex + 1 : null,
        ...details
    });
}

function getPredictionTarget(frame) {
    const changes = frame?.changes || [];
    return changes.find(change => change.changeType !== "removed") || changes[0] || null;
}

function getPredictionKey(frame, target) {
    if (!frame || !target) return "";
    return [
        frame.stepNumber ?? currentFrameIndex + 1,
        frame.line ?? "",
        frame.scopeName ?? "",
        target.name ?? ""
    ].join("|");
}

function shouldShowPredictionAnswer(frame, target) {
    if (activeLearningMode !== "prediction" || !frame || !target) return true;
    return revealedPredictionKeys.has(getPredictionKey(frame, target));
}

function setPredictionLabVisible(isVisible) {
    if (!predictionLab) return;
    predictionLab.style.display = isVisible ? "grid" : "none";
}

function shouldHideVariablesForPrediction(frame, target = getPredictionTarget(frame)) {
    return activeLearningMode === "prediction" && frame && target && !shouldShowPredictionAnswer(frame, target);
}

function getMaskedValue(value, hidden = false) {
    return hidden ? "hidden until checked" : value;
}

const EDITOR_LINE_HEIGHT = 22.4;
const EDITOR_VERTICAL_PADDING = 40;
const EDITOR_MAX_VISIBLE_LINES = 10;

function updateEditorViewport(lineCount) {
    const safeLineCount = Math.max(1, lineCount);
    const visibleLines = Math.min(safeLineCount, EDITOR_MAX_VISIBLE_LINES);
    const height = Math.round(EDITOR_VERTICAL_PADDING + visibleLines * EDITOR_LINE_HEIGHT);

    if (workspaceBody) {
        workspaceBody.style.setProperty("--workspace-height", `${height}px`);
        workspaceBody.classList.toggle("scrolling-code", safeLineCount > EDITOR_MAX_VISIBLE_LINES);
    }

    if (editorTitle) {
        const plural = safeLineCount === 1 ? "line" : "lines";
        const scrollNote = safeLineCount > EDITOR_MAX_VISIBLE_LINES ? ", scroll" : "";
        editorTitle.textContent = `Code (${safeLineCount} ${plural}${scrollNote})`;
    }
}

function scrollHighlightedLineIntoView(lineNumber, totalLines) {
    if (totalLines <= EDITOR_MAX_VISIBLE_LINES) {
        codeInput.scrollTop = 0;
        codeViewer.scrollTop = 0;
        gutterZone.scrollTop = 0;
        return;
    }

    if (!lineNumber || lineNumber < 1) return;

    const topLine = Math.max(1, lineNumber - Math.floor(EDITOR_MAX_VISIBLE_LINES / 2));
    const nextTop = Math.max(0, (topLine - 1) * EDITOR_LINE_HEIGHT);

    codeInput.scrollTop = nextTop;
    codeViewer.scrollTop = nextTop;
    gutterZone.scrollTop = nextTop;
}

function shouldColorCodeVariables() {
    return isTimelineActive
        && pipelineSteps.length > 0
        && !pipelineSteps.some(step => step.error)
        && Object.keys(variableColorMap).length > 0;
}

function renderLineWithVariableColors(lineText) {
    const variableNames = Object.keys(variableColorMap)
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);

    if (!variableNames.length) {
        return escapeHtml(lineText) || " ";
    }

    const identifierPattern = `[A-Za-z_][A-Za-z0-9_]*`;
    const variablePattern = new RegExp(identifierPattern, "g");
    let rendered = "";
    let lastIndex = 0;
    let match;

    while ((match = variablePattern.exec(lineText)) !== null) {
        const token = match[0];
        const start = match.index;
        const end = start + token.length;

        rendered += escapeHtml(lineText.slice(lastIndex, start));

        if (variableNames.includes(token)) {
            const color = variableColorMap[token];
            rendered += `<span class="code-variable-token" style="--variable-color: ${escapeHtml(color)};">${escapeHtml(token)}</span>`;
        } else {
            rendered += escapeHtml(token);
        }

        lastIndex = end;
    }

    rendered += escapeHtml(lineText.slice(lastIndex));
    return rendered || " ";
}

function syncEditorRendering(highlightLineNum = -1) {
    const lines = codeInput.value.split('\n');
    updateEditorViewport(lines.length);
    const shouldColorVariables = shouldColorCodeVariables();

    if (workspaceBody) {
        workspaceBody.classList.toggle("variable-colored", shouldColorVariables);
    }

    gutterZone.innerHTML = '';
    codeViewer.innerHTML = '';

    lines.forEach((lineText, index) => {
        const lineNum = index + 1;

        const gutterNum = document.createElement('div');
        gutterNum.className = 'gutter-num';
        gutterNum.textContent = lineNum;
        if (lineNum === highlightLineNum) {
            gutterNum.classList.add('active-num');
        }
        gutterZone.appendChild(gutterNum);

        const row = document.createElement('div');
        row.className = 'render-line-row';
        if (lineNum === highlightLineNum) {
            row.classList.add('active-row');
        }

        if (shouldColorVariables) {
            row.innerHTML = renderLineWithVariableColors(lineText);
        } else {
            row.textContent = lineText === '' ? ' ' : lineText;
        }

        codeViewer.appendChild(row);
    });

    scrollHighlightedLineIntoView(highlightLineNum, lines.length);
}

function resetTimelineState() {
    isTimelineActive = false;
    pipelineSteps = [];
    variableColorMap = {};
    currentFrameIndex = 0;
    predictionTarget = null;
    predictionAttemptCounts = {};
    revealedPredictionKeys = new Set();
    lastLessonResult = null;
    slider.max = 0;
    slider.value = 0;
    slider.disabled = true;
    stepCounter.textContent = "0/0";
    syncEditorRendering();
    renderScopeGrid({});
    renderConceptTags([]);
    resetPredictionPanel();
    renderLessonStatus(null);
    renderTeacherInsights();
    renderInitialConsole();
}

function populateLessonSelect() {
    lessonSelect.innerHTML = STUDENT_TOPIC_ORDER
        .filter(id => LESSONS[id])
        .map(id => `<option value="${id}">${escapeHtml(LESSONS[id].title)}</option>`)
        .join('');
    lessonSelect.value = activeLessonId;
}

function populateModeSelect() {
    modeSelect.innerHTML = Object.entries(LEARNING_MODES)
        .map(([id, mode]) => `<option value="${id}">${escapeHtml(mode.title)}</option>`)
        .join('');
    modeSelect.value = activeLearningMode;
}

function populateTaskSelect(topicId) {
    const tasks = getTasksForTopic(topicId);
    exampleSelect.innerHTML = tasks
        .map(task => `<option value="${task.id}">${escapeHtml(task.title)}</option>`)
        .join('');

    if (!tasks.some(task => task.id === activeTaskId)) {
        activeTaskId = tasks[0]?.id || "";
    }

    exampleSelect.value = activeTaskId;
}

function getMissionIndex(topicId = activeLessonId, taskId = activeTaskId) {
    return getPracticePath(topicId).findIndex(mission => mission.topicId === topicId && mission.taskId === taskId);
}

function getPracticePath(topicId = activeLessonId) {
    const tasks = getTasksForTopic(topicId);
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    const batch = getTopicBatch(topicId);
    const configuredIds = batch.taskIds?.length ? batch.taskIds : tasks.slice(0, 5).map(task => task.id);
    return configuredIds
        .map((taskId, index) => {
            const task = taskMap.get(taskId);
            if (!task) return null;
            return {
                topicId,
                taskId,
                batchId: batch.batchId,
                level: index + 1,
                stage: LEVEL_STAGE_LABELS[index] || `Level ${index + 1}`
            };
        })
        .filter(Boolean);
}

function isMissionLevelAccessible(index, completed = getCompletedMissions(), path = getPracticePath()) {
    if (index < 0) return false;
    const mission = path[index];
    if (!mission) return false;
    const previousMission = index > 0 ? path[index - 1] : null;
    return index === 0 || isMissionCompleted(previousMission, completed) || isMissionCompleted(mission, completed);
}

function getFirstAvailableMission(topicId = activeLessonId) {
    const completed = getCompletedMissions();
    const path = getPracticePath(topicId);
    return path.find((mission, index) => {
        return !isMissionCompleted(mission, completed) && isMissionLevelAccessible(index, completed, path);
    }) || path[path.length - 1];
}

function getTopicProgress(topicId) {
    const completed = getCompletedMissions();
    const path = getPracticePath(topicId);
    const completedCount = path.filter(mission => isMissionCompleted(mission, completed)).length;
    const nextMission = path.find((mission, index) => {
        return !isMissionCompleted(mission, completed) && isMissionLevelAccessible(index, completed, path);
    });

    return {
        path,
        completedCount,
        totalCount: path.length,
        nextMission,
        percent: path.length ? Math.round((completedCount / path.length) * 100) : 0
    };
}

function setActiveView(view) {
    activeView = ["dashboard", "bank"].includes(view) ? view : "practice";
    syncModeShell();
    renderDashboard();
    renderQuestionBank();
}

function ensureMissionTaskSelected() {
    if (activeLearningMode !== "mission") return;

    const currentMissionIndex = getMissionIndex();
    if (isMissionLevelAccessible(currentMissionIndex)) return;

    const mission = getFirstAvailableMission(activeLessonId);
    if (!mission) return;

    activeLessonId = mission.topicId;
    lessonSelect.value = mission.topicId;
    populateTaskSelect(mission.topicId);
    setActiveTask(mission.taskId, false);
}

function syncModeShell() {
    document.body.classList.toggle("dashboard-active", activeView === "dashboard");
    document.body.classList.toggle("question-bank-active", activeView === "bank");
    btnPracticeView?.classList.toggle("active", activeView === "practice");
    btnDashboardView?.classList.toggle("active", activeView === "dashboard");
    btnQuestionBankView?.classList.toggle("active", activeView === "bank");

    if (!modeContext) return;

    modeContext.innerHTML = `<strong>Practice flow:</strong> choose a Practice Topic, follow the current Level card, then click Compile & Run. Level 1 uses the Fill-in-the-blank gate; Levels 2-5 are edited in Code.`;
}

function setActiveLesson(id, shouldLog = true) {
    activeContentMode = "practice-task";
    activeLessonId = id;
    lessonSelect.value = id;
    const firstMission = getFirstAvailableMission(id);
    activeTaskId = firstMission?.taskId || getTasksForTopic(id)[0]?.id || "";
    clearWalkthroughState();
    resetModeInteractionState();
    populateTaskSelect(id);
    setActiveTask(activeTaskId, false);

    if (shouldLog) {
        logStudentAction("select", "Topic", {
            selectedTopicId: id,
            selectedTopicTitle: LESSONS[id].title
        });
        maybePromptCompletedTopic(id);
    }
    renderDashboard();
    renderQuestionBank();
}

function maybePromptCompletedTopic(topicId) {
    const progress = getTopicProgress(topicId);
    if (!progress.totalCount || progress.completedCount < progress.totalCount) return;
    if (!topicCompleteOverlay) return;

    pendingCompletedTopicId = topicId;
    const topicTitle = LESSONS[topicId]?.title || topicId;
    if (topicCompleteTitle) {
        topicCompleteTitle.textContent = `${topicTitle} cleared`;
    }
    if (topicCompleteBody) {
        const setCount = getQuestionSetsForTopic(topicId).length;
        topicCompleteBody.textContent = `You have completed all ${progress.totalCount} levels in this topic. Refresh loads the next unused set from ${setCount} prepared sets. After every set has been completed, refresh repeats an earlier set for review. Repeat Last Set keeps the current questions.`;
    }
    topicCompleteOverlay.classList.add("visible");
}

function closeTopicCompleteDialog() {
    pendingCompletedTopicId = null;
    topicCompleteOverlay?.classList.remove("visible");
}

function refreshTopicPracticeBatch(topicId) {
    if (!topicId || !LESSONS[topicId]) return;
    refreshTopicBatch(topicId);
    if (topicId === activeLessonId) {
        clearWalkthroughState();
        resetModeInteractionState();
        const firstMission = getFirstAvailableMission(topicId);
        activeTaskId = firstMission?.taskId || getTasksForTopic(topicId)[0]?.id || "";
        populateTaskSelect(topicId);
        setActiveTask(activeTaskId, false);
    }
    populateReportScopeSelect();
    renderDashboard();
    renderQuestionBank();
}

function acceptTopicRefresh() {
    const topicId = pendingCompletedTopicId || activeLessonId;
    closeTopicCompleteDialog();
    refreshTopicPracticeBatch(topicId);
    logStudentAction("button", "Refresh Topic Batch", {
        selectedTopicId: topicId
    });
}

function setActiveTask(taskId, shouldLog = true) {
    const task = getTasksForTopic(activeLessonId).find(item => item.id === taskId);
    if (!task) return;

    activeContentMode = "practice-task";
    activeTaskId = taskId;
    exampleSelect.value = taskId;
    blankDraftValues = {};
    codeInput.readOnly = isBlankTask(task);
    codeInput.value = renderCodeWithBlankValues(task);
    clearWalkthroughState();
    resetModeInteractionState();
    resetTimelineState();
    renderLessonGoal();
    updateRunAvailability();

    if (shouldLog) {
        logStudentAction("select", "Practice Task", {
            selectedTaskId: taskId,
            selectedTaskTitle: task.title
        });
    }
}

function renderLessonGoal() {
    syncModeShell();
    const task = getActiveTask();
    if (!task) return;

    const mode = LEARNING_MODES[activeLearningMode] || LEARNING_MODES.mission;
    const meta = getTaskMeta(task);

    renderTopicInfo();
    if (exercisePanelTitle) {
        exercisePanelTitle.textContent = mode.panelTitle;
    }

    lessonGoal.innerHTML = `
        ${renderLearningModePanel(task, meta)}
        ${renderFunctionHints(task)}
    `;
    renderBlankSlot(task);
}

function getFunctionHintsForTask(task) {
    if (!task) return [];
    const haystack = [
        task.starterCode,
        task.objective,
        task.title,
        getTaskMeta(task).story,
        task.solution
    ].join("\n");

    const explicitHints = new Set(task.functionHints || []);
    return Object.entries(PYTHON_FUNCTION_HINTS)
        .filter(([functionName]) => explicitHints.has(functionName) || new RegExp(`\\b${escapeRegExp(functionName)}\\s*\\(`).test(haystack))
        .map(([, hint]) => hint);
}

function renderFunctionHints(task) {
    const hints = getFunctionHintsForTask(task);
    if (!hints.length) return "";

    return `
        <div class="function-hints">
            <div class="function-hint-title">Python Function Hint</div>
            <div class="function-hint-grid">
                ${hints.map(hint => `
                    <div class="function-hint">
                        <strong><code>${escapeHtml(hint.name)}</code></strong>
                        <span>${escapeHtml(hint.purpose)}</span>
                        <span><code>${escapeHtml(hint.example)}</code></span>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

function renderBlankSlot(task) {
    if (!blankSlot) return;
    const html = renderBlankRequirements(task);
    blankSlot.innerHTML = html;
    blankSlot.classList.toggle("active", Boolean(html));
}

function getSkillLabel(skillId) {
    return SKILL_DEFINITIONS.find(skill => skill.id === skillId)?.label || skillId;
}

function renderLearningModePanel(task, meta) {
    if (activeLearningMode === "prediction") return renderPredictionModePanel(meta);
    if (activeLearningMode === "debug") return renderDebugDetectivePanel(meta);
    if (activeLearningMode === "aiReview") return renderAiReviewPanel(task, meta);
    if (activeLearningMode === "skillTree") return renderSkillTreePanel(meta);
    return renderMissionModePanel();
}

function renderWalkthroughControls(modeId, options = {}) {
    const demo = WALKTHROUGH_DEMOS[modeId];
    const steps = (demo?.steps || []).map((step, index) => `
        <div class="walkthrough-step"><strong>${index + 1}</strong><span>${escapeHtml(step)}</span></div>
    `).join("");
    const feedback = activeWalkthroughMode === modeId && walkthroughFeedback
        ? `<div class="walkthrough-banner">${escapeHtml(walkthroughFeedback)}</div>`
        : "";
    const compact = options.compact === true;
    return `
        <div class="walkthrough-steps">
            ${compact ? `<div class="walkthrough-step"><strong>Optional</strong><span>Watch one sample level complete automatically, then continue with the real current level.</span></div>` : `
                <div class="walkthrough-step"><strong>Demo</strong><span>${escapeHtml(demo?.summary || "Run a guided example for this mode.")}</span></div>
                ${steps}
            `}
            <div class="mode-actions">
                <button class="secondary-btn walkthrough-button" type="button" data-walkthrough-mode="${escapeHtml(modeId)}">Walkthrough This Mode</button>
            </div>
            ${feedback}
        </div>
    `;
}

function getGoalCheckSummary(task) {
    const goalCheck = task?.checks?.find(check => check.type === "variableEquals");
    if (!goalCheck) return "the target variable matches the task goal";
    return `${goalCheck.variable} finishes as ${goalCheck.expected}`;
}

function getBlankTaskSummary(task) {
    if (!task?.blanks?.length) return "the missing code fragment";
    return task.blanks
        .map(blank => `${blank.token}: ${blank.label}`)
        .join("; ");
}

function getPracticeActionSteps(task, activeMissionIndex) {
    const goal = getGoalCheckSummary(task);
    const levelNumber = activeMissionIndex >= 0 ? activeMissionIndex + 1 : null;
    const levelPrefix = levelNumber ? `Level ${levelNumber}` : "This level";

    if (task?.taskType === "level-1-blank") {
        return [
            `${levelPrefix} is a fill-in task: type the missing Python fragment in Fill-in-the-blank gate, not directly in Code.`,
            `Fill: ${getBlankTaskSummary(task)}.`,
            `Then click Compile & Run. The level passes when ${goal}.`
        ];
    }

    if (task?.taskType === "level-2-line") {
        return [
            `${levelPrefix} asks for one complete Python line.`,
            `Replace the placeholder line such as pass with one valid line; keep the surrounding starter code.`,
            `Click Compile & Run. The level passes when ${goal}.`
        ];
    }

    if (task?.taskType === "level-3-program") {
        return [
            `${levelPrefix} asks you to write the complete working logic.`,
            `Use the comments as the goal, replace pass, and create any needed variables, loops, conditions, or function calls.`,
            `Click Compile & Run. The trace must prove ${goal}.`
        ];
    }

    if (task?.taskType === "level-4-refactor") {
        return [
            `${levelPrefix} is a code-quality task.`,
            `Keep the same final result, but replace repeated or noisy code with the topic's main pattern.`,
            `Click Compile & Run. The level passes when ${goal} and the quality checks accept the refined code.`
        ];
    }

    if (task?.taskType === "level-5-debug") {
        return [
            `${levelPrefix} is Debug Detective.`,
            `Find why the starter code breaks, repair the real cause, and avoid writing only a direct final answer.`,
            `Click Compile & Run. The level passes when the program runs cleanly and ${goal}.`
        ];
    }

    return [
        `${levelPrefix}: read the objective, edit Code, and run the trace.`,
        `The level passes when ${goal}.`
    ];
}

function renderPracticeActionGuide(task, activeMissionIndex, currentCompleted) {
    const steps = getPracticeActionSteps(task, activeMissionIndex);
    return `
        <div class="mission-action-guide">
            <div class="mission-action-title">${currentCompleted ? "Review this level" : "What to do now"}</div>
            ${steps.map((step, index) => `
                <div class="mission-action-row">
                    <strong>${index + 1}</strong>
                    <span>${escapeHtml(step)}</span>
                </div>
            `).join("")}
        </div>
    `;
}

function renderPredictionModePanel(meta) {
    return `
        <div class="mode-panel">
            <div class="mode-panel-title">Prediction Game</div>
            <div class="mode-panel-copy">${escapeHtml(LEARNING_MODES.prediction.summary)}</div>
            <div class="mode-panel-copy">Run the code, use the timeline, and answer the Prediction Lab before the current value is revealed.</div>
            ${renderWalkthroughControls("prediction")}
            ${renderSkillMiniGrid(meta.skills)}
        </div>
    `;
}

function renderMissionModePanel() {
    const completed = getCompletedMissions();
    const path = getPracticePath(activeLessonId);
    const activeMissionIndex = path.findIndex(mission => mission.topicId === activeLessonId && mission.taskId === activeTaskId);
    const activeTask = getActiveTask();
    const meta = getTaskMeta(activeTask);
    const currentMission = path[activeMissionIndex] || null;
    const currentCompleted = isMissionCompleted(currentMission, completed);
    const showWalkthrough = activeMissionIndex <= 0 && !isMissionCompleted(path[0], completed);
    const missionCards = path.map((mission, index) => {
        const task = getTasksForTopic(mission.topicId).find(item => item.id === mission.taskId);
        const unlocked = isMissionLevelAccessible(index, completed, path);
        const active = mission.topicId === activeLessonId && mission.taskId === activeTaskId;
        const missionCompleted = isMissionCompleted(mission, completed);
        const state = missionCompleted ? "Completed" : active ? "Current" : unlocked ? "Ready" : "Locked";
        return `
            <button class="mission-card ${active ? "active" : ""} ${missionCompleted ? "completed" : ""}" type="button"
                data-mission-topic="${escapeHtml(mission.topicId)}" data-mission-task="${escapeHtml(mission.taskId)}" ${unlocked ? "" : "disabled"}>
                <strong>Level ${index + 1}: ${escapeHtml(mission.stage)}</strong>
                <span>${escapeHtml(task?.title || "Practice task")}</span>
                <span>${state}</span>
            </button>
        `;
    }).join("");

    const activeLevelText = activeMissionIndex >= 0 ? `Level ${activeMissionIndex + 1}` : "Selected practice";
    const totalLevels = Math.max(path.length, 1);
    const nextReadyMission = path.find((mission, index) => {
        if (index <= activeMissionIndex) return false;
        return !isMissionCompleted(mission, completed) && isMissionLevelAccessible(index, completed, path);
    });
    const completeLine = currentCompleted
        ? nextReadyMission
            ? "This level is already completed. Click the next Ready level card to continue."
            : "This topic path is complete. Open Dashboard to review your growth."
        : "This level is not completed yet. Edit the code, then click Compile & Run.";

    return `
        <div class="mode-panel">
            <div class="mission-current">
                <strong>${escapeHtml(LESSONS[activeLessonId]?.title || "Practice")} - ${escapeHtml(activeLevelText)}: ${escapeHtml(path[activeMissionIndex]?.stage || "Practice")}</strong>
                <span>${escapeHtml(activeTask?.title || "Practice task")}</span>
                <span>${escapeHtml(activeTask?.objective || "Make the program meet the task goal.")}</span>
                <span>${escapeHtml(completeLine)}</span>
            </div>
            ${renderPracticeActionGuide(activeTask, activeMissionIndex, currentCompleted)}
            ${activeMissionIndex <= 0 ? renderMissionRules("mission-panel-rules", totalLevels) : ""}
            ${renderMissionRunFeedback(lastLessonResult)}
            ${activeMissionIndex === 4 ? renderDebugRunFeedback(lastLessonResult, activeTask, meta) : ""}
            ${activeMissionIndex === 4 ? renderDebugDetectiveActivity(meta) : ""}
            ${showWalkthrough ? renderWalkthroughControls("mission", { compact: true }) : ""}
            <div class="mission-grid">${missionCards}</div>
        </div>
    `;
}

function renderMissionRules(extraClass = "", totalLevels = getPracticePath(activeLessonId).length || 5) {
    return `
        <div class="mission-rules ${escapeHtml(extraClass)}">
            <div><strong>Goal:</strong> complete Level 1 to Level ${totalLevels} in order for the selected topic.</div>
            <div><strong>How to complete a level:</strong> fill the key expression or edit Code, then click Compile & Run.</div>
            <div><strong>Auto-check:</strong> the app marks a level Completed automatically when Compile & Run meets all task checks.</div>
        </div>
    `;
}

function renderMissionRunFeedback(result) {
    if (!result) {
        return `<div class="mission-feedback">After you click Compile & Run, this box will say whether the current level passed or what still needs fixing.</div>`;
    }

    const statusClass = result.passed ? "passed" : "failed";
    const path = getPracticePath(activeLessonId);
    const activeMissionIndex = getMissionIndex(activeLessonId, activeTaskId);
    const completed = getCompletedMissions();
    const hasNextReady = path.some((mission, index) => {
        if (index <= activeMissionIndex) return false;
        return !isMissionCompleted(mission, completed) && isMissionLevelAccessible(index, completed, path);
    });
    const heading = result.passed
        ? hasNextReady ? "Level passed. The next level is now unlocked." : "Level passed. This topic path is complete."
        : "Level not completed yet. Fix the items below, then run again.";
    const rows = result.criteria.map((item, index) => {
        const revealed = revealedMissionFixes.has(index);
        const fix = item.fix || getDefaultCriterionFix(item);
        return `
            <div class="mission-criterion-row">
                <div class="${item.passed ? "ok" : "fix"}">${item.passed ? "[ok]" : "[fix]"} ${escapeHtml(item.label)}</div>
                ${item.passed ? "" : `<button class="mini-fix-button mission-fix-button" type="button" data-fix-index="${index}">${revealed ? "Hide fix" : "Show fix"}</button>`}
                ${!item.passed && revealed ? `<div class="mission-fix-answer">${escapeHtml(fix)}</div>` : ""}
            </div>
        `;
    }).join("");

    return `
        <div class="mission-feedback ${statusClass}">
            <strong>${heading}</strong>
            ${rows}
        </div>
    `;
}

function renderDebugRunFeedback(result, task, meta) {
    if (task?.taskType !== "level-5-debug") return "";

    const feedback = buildDebugRunFeedback(result, task, meta);
    const rows = feedback.items.map(item => `
        <div class="debug-feedback-item ${item.kind}">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.detail)}</span>
        </div>
    `).join("");

    return `
        <div class="debug-run-feedback ${feedback.status}">
            <div class="debug-feedback-heading">${escapeHtml(feedback.heading)}</div>
            <div class="debug-feedback-list">${rows}</div>
        </div>
    `;
}

function buildDebugRunFeedback(result, task, meta) {
    if (!result) {
        return {
            status: "notice",
            heading: "Debug Detective feedback",
            items: [
                {
                    kind: "notice",
                    title: "Flexible fix accepted",
                    detail: "Your code does not need to match a hidden sample answer. Compile & Run checks whether the trace proves the bug is fixed."
                },
                {
                    kind: "notice",
                    title: "What to inspect",
                    detail: meta?.debug?.fixHint || "Find the line that changes the wrong state, explain it, then repair the program logic."
                }
            ]
        };
    }

    const failedCriteria = (result.criteria || []).filter(item => !item.passed);
    const reportCoaching = getDebugReportCoaching(meta, result.passed);

    if (result.passed) {
        const items = [
            {
                kind: "good",
                title: "Fix accepted",
                detail: "The program now meets the goal and the trace has enough evidence. This can be a different solution from the sample answer."
            }
        ];

        if (reportCoaching) {
            items.push(reportCoaching);
        }

        return {
            status: "passed",
            heading: "Debug Detective feedback: accepted",
            items
        };
    }

    const items = [];
    const errorCriterion = failedCriteria.find(item => item.type === "noErrors");
    if (errorCriterion) {
        const errorFrame = getFirstErrorFrame();
        items.push({
            kind: "fix",
            title: "Make the program run first",
            detail: errorFrame
                ? `The trace stops on line ${errorFrame.line} with ${errorFrame.friendlyErrorTitle || errorFrame.errorType || "an error"}. Fix that executable error before judging the final value.`
                : "The program still stops before finishing. Read Step Explanation, repair the broken line, then run again."
        });
    }

    failedCriteria
        .filter(item => item.type === "antiShortcut")
        .forEach(item => {
            items.push({
                kind: "fix",
                title: "Avoid hard-coded final answers",
                detail: `${item.label} Debug Detective accepts many fixes, but the trace must show the broken process was repaired instead of assigning the answer directly.`
            });
        });

    failedCriteria
        .filter(item => item.type === "variableEquals")
        .forEach(item => {
            items.push(describeVariableDebugIssue(item));
        });

    failedCriteria
        .filter(item => item.type === "stdoutContains")
        .forEach(item => {
            items.push({
                kind: "fix",
                title: "Console output still does not match",
                detail: `${item.label} The program may compute the right internal value but still needs to print the required evidence.`
            });
        });

    failedCriteria
        .filter(item => item.type === "conceptSeen")
        .forEach(item => {
            items.push({
                kind: "fix",
                title: "Process evidence is missing",
                detail: `The final value alone is not enough here. The trace still needs to show ${item.concept}, so use the task's intended programming pattern.`
            });
        });

    if (reportCoaching) {
        items.push(reportCoaching);
    }

    if (meta?.debug?.cause) {
        items.push({
            kind: "notice",
            title: "Original bug clue",
            detail: meta.debug.cause
        });
    }

    if (meta?.debug?.fixHint) {
        items.push({
            kind: "notice",
            title: "Useful next move",
            detail: meta.debug.fixHint
        });
    }

    if (!items.length) {
        items.push({
            kind: "fix",
            title: "Trace still does not prove the fix",
            detail: "Run the timeline to the last step, compare the target variable with the goal, and adjust the line that last changed it."
        });
    }

    return {
        status: "failed",
        heading: "Debug Detective feedback: not fixed yet",
        items
    };
}

function describeVariableDebugIssue(item) {
    const actual = normalizeValue(item.actual);
    const expected = normalizeValue(item.expected);
    const variable = item.variable || "the target variable";

    if (!actual) {
        return {
            kind: "fix",
            title: `${variable} was not created`,
            detail: `The goal needs ${variable} to finish as ${expected}, but the trace never creates that variable. Check spelling and make sure the assignment runs before the program ends.`
        };
    }

    const actualNumber = Number(actual);
    const expectedNumber = Number(expected);
    if (Number.isFinite(actualNumber) && Number.isFinite(expectedNumber)) {
        if (actualNumber < expectedNumber) {
            return {
                kind: "fix",
                title: `${variable} is too small`,
                detail: `${variable} finished as ${actual}, but the goal is ${expected}. This often means an old value is being overwritten, a counter is not incremented enough, or a loop/recursive call stops too early.`
            };
        }

        if (actualNumber > expectedNumber) {
            return {
                kind: "fix",
                title: `${variable} is too large`,
                detail: `${variable} finished as ${actual}, but the goal is ${expected}. This often means a value is counted too many times, a boundary condition is too wide, or the loop runs too long.`
            };
        }
    }

    if (/^(True|False)$/i.test(expected)) {
        return {
            kind: "fix",
            title: `${variable} has the wrong truth value`,
            detail: `${variable} finished as ${actual}, but it should be ${expected}. Check the condition, the branch that writes ${variable}, and whether the loop should stop after the match.`
        };
    }

    return {
        kind: "fix",
        title: `${variable} has the wrong final value`,
        detail: `${variable} finished as ${actual}, but it should be ${expected}. Re-watch the last timeline step that changes ${variable}; that line is usually the best place to repair the bug.`
    };
}

function getDebugReportCoaching(meta, runPassed) {
    const expectedLine = meta?.debug?.line;

    if (!expectedLine) {
        return null;
    }

    if (!selectedBugLine) {
        return {
            kind: "notice",
            title: runPassed ? "Add line evidence" : "Pick the suspicious line",
            detail: runPassed
                ? "The code fix passed. For debugging practice, still select the suspicious line and write why it caused the bad state."
                : "Before another attempt, choose the line that creates the wrong state. The selected line should connect to the target variable's bad final value."
        };
    }

    if (selectedBugLine !== expectedLine) {
        return {
            kind: runPassed ? "notice" : "fix",
            title: "Bug report line may be off",
            detail: `Your report points to line ${selectedBugLine}. Compare it with the line that originally changed the target variable incorrectly.`
        };
    }

    if (debugReportFeedback?.kind === "good") {
        return {
            kind: "good",
            title: "Bug report matches the trace",
            detail: "Your selected line and explanation connect the bad state to the code change."
        };
    }

    return {
        kind: "notice",
        title: "Line evidence is close",
        detail: `Line ${selectedBugLine} is the likely bug source. Submit a short explanation of why that line breaks the goal.`
    };
}

function getFirstErrorFrame(steps = pipelineSteps) {
    return (steps || []).find(step => step.error);
}

function getDefaultCriterionFix(item) {
    if (item.type === "variableEquals") {
        return `Expected answer: ${item.variable} should finish as ${item.expected}. Use the program steps to produce that value, not a direct final assignment.`;
    }
    if (item.type === "conceptSeen" && item.concept === "Accumulator") {
        return "Correct pattern: keep the old running total and add the current item, for example total_sum = total_sum + number, total_sum += number, or accumulator = total_sum + number followed by total_sum = accumulator.";
    }
    if (item.type === "antiShortcut") {
        return "Remove the direct final answer assignment. The trace must show the value being produced by the required algorithm, such as a loop, condition, function call, recursion, or accumulator update.";
    }
    if (item.type === "noErrors") {
        return "Read the raw error in Step Explanation, fix that line, then run again.";
    }
    return "Use the trace evidence above to repair this item, then click Compile & Run again.";
}

function renderDebugDetectiveActivity(meta) {
    const codeLines = codeInput.value.split('\n');
    const lineButtons = codeLines.map((lineText, index) => {
        const lineNumber = index + 1;
        const label = lineText.trim() || "(blank)";
        return `<button class="bug-line-button ${selectedBugLine === lineNumber ? "selected" : ""}" type="button" data-bug-line="${lineNumber}">${lineNumber}: ${escapeHtml(label.slice(0, 18))}</button>`;
    }).join("");
    const feedback = debugReportFeedback
        ? `<div class="mode-feedback ${debugReportFeedback.kind}">${escapeHtml(debugReportFeedback.text)}</div>`
        : `<div class="mode-feedback">Level 5 asks you to inspect the code like a reviewer: pick the suspicious line, explain the state problem, then repair and run it.</div>`;

    return `
        <div class="debug-activity">
            <div class="mode-panel-title">Level 5 Debug Detective</div>
            <div class="mode-panel-copy">${escapeHtml(meta.debug?.fixHint || "Find the line that prevents the program from meeting the goal. Then explain the problem before fixing the code.")}</div>
            <div class="debug-line-grid">${lineButtons}</div>
            <textarea class="mode-textarea" id="debug-reason" placeholder="Why does this line break the goal?"></textarea>
            <div class="mode-actions">
                <button class="secondary-btn debug-submit" type="button">Submit Bug Report</button>
            </div>
            ${feedback}
        </div>
    `;
}

function renderDebugDetectivePanel(meta) {
    const codeLines = codeInput.value.split('\n');
    const lineButtons = codeLines.map((lineText, index) => {
        const lineNumber = index + 1;
        const label = lineText.trim() || "(blank)";
        return `<button class="bug-line-button ${selectedBugLine === lineNumber ? "selected" : ""}" type="button" data-bug-line="${lineNumber}">${lineNumber}: ${escapeHtml(label.slice(0, 18))}</button>`;
    }).join("");
    const feedback = debugReportFeedback
        ? `<div class="mode-feedback ${debugReportFeedback.kind}">${escapeHtml(debugReportFeedback.text)}</div>`
        : `<div class="mode-feedback">Pick the suspicious line, explain the state problem, then repair the code and run again.</div>`;

    return `
        <div class="mode-panel">
            <div class="mode-panel-title">Debug Detective</div>
            <div class="mode-panel-copy">${escapeHtml(meta.debug?.fixHint || LEARNING_MODES.debug.summary)}</div>
            ${renderWalkthroughControls("debug")}
            <div class="debug-line-grid">${lineButtons}</div>
            <textarea class="mode-textarea" id="debug-reason" placeholder="Why does this line break the goal?"></textarea>
            <div class="mode-actions">
                <button class="secondary-btn debug-submit" type="button">Submit Bug Report</button>
            </div>
            ${feedback}
        </div>
    `;
}

function renderAiReviewPanel(task, meta) {
    const review = meta.aiReview || {
        prompt: LEARNING_MODES.aiReview.summary,
        concerns: [
            { id: "trace-needed", label: "The code should be verified with a trace and final-value check.", expected: true },
            { id: "readability", label: "Names and structure should be readable enough for another learner.", expected: true },
            { id: "always-shorter", label: "The shortest possible code is automatically the best code.", expected: false }
        ]
    };
    const concerns = review.concerns.map(item => `
        <label class="review-option">
            <input class="review-check" type="checkbox" value="${escapeHtml(item.id)}" ${reviewSelections.has(item.id) ? "checked" : ""}>
            <span>${escapeHtml(item.label)}</span>
        </label>
    `).join("");
    const feedback = reviewFeedback
        ? `<div class="mode-feedback ${reviewFeedback.kind}">${escapeHtml(reviewFeedback.text)}</div>`
        : `<div class="mode-feedback">Select the issues a reviewer should raise, then improve and run the code.</div>`;

    return `
        <div class="mode-panel">
            <div class="mode-panel-title">AI Code Review</div>
            <div class="mode-panel-copy">${escapeHtml(review.prompt)}</div>
            ${renderWalkthroughControls("aiReview")}
            <div class="review-checklist">${concerns}</div>
            <div class="mode-actions">
                <button class="secondary-btn review-submit" type="button">Submit Review</button>
            </div>
            ${feedback}
            ${renderCodeQualityPanel(task)}
        </div>
    `;
}

function renderSkillTreePanel(meta) {
    return `
        <div class="mode-panel">
            <div class="mode-panel-title">Growth Map</div>
            <div class="mode-panel-copy">${escapeHtml(LEARNING_MODES.skillTree.summary)}</div>
            ${renderWalkthroughControls("skillTree")}
            ${renderSkillMiniGrid(meta.skills, true)}
        </div>
    `;
}

function renderSkillMiniGrid(focusSkills, showAll = false) {
    const progress = getSkillProgress();
    const focus = new Set(focusSkills || []);
    const skills = showAll ? SKILL_DEFINITIONS : SKILL_DEFINITIONS.filter(skill => focus.has(skill.id));
    const rows = skills.map(skill => {
        const value = progress[skill.id] || 0;
        return `
            <div class="skill-row">
                <span>${escapeHtml(skill.label)}</span>
                <div class="skill-track"><div class="skill-fill" style="width: ${value}%"></div></div>
                <strong>${value}%</strong>
            </div>
        `;
    }).join("");

    return `<div class="skill-grid">${rows || `<div class="mode-panel-copy">This task will update trace-reading progress.</div>`}</div>`;
}

function renderDashboard() {
    if (!dashboardSummary || !dashboardSkillCloud || !dashboardTopicTable) return;

    const completed = getCompletedMissions();
    const topicTrees = STUDENT_TOPIC_ORDER
        .filter(topicId => LESSONS[topicId])
        .map(topicId => {
            const tree = buildTopicTree(topicId, completed);
            const nextLevelLabel = tree.nextLevel
                ? `Level ${tree.nextLevel.level}: ${tree.nextLevel.stage}`
                : "All levels complete";
            return { ...tree, nextLevelLabel };
        });
    const totalLevels = topicTrees.reduce((sum, topic) => sum + topic.totalCount, 0);
    const completedLevels = topicTrees.reduce((sum, topic) => sum + topic.completedCount, 0);
    const totalTasks = topicTrees.reduce((sum, topic) => sum + topic.taskCount, 0);
    const completedTasks = topicTrees.reduce((sum, topic) => sum + topic.completedTaskCount, 0);
    const skillProgress = getSkillProgress();
    const trainedSkills = Object.values(skillProgress).filter(value => value > 0).length;
    const overallPercent = totalLevels ? Math.round((completedLevels / totalLevels) * 100) : 0;

    dashboardSummary.innerHTML = `
        <div class="dashboard-grid" style="grid-template-columns: repeat(2, minmax(140px, 1fr));">
            <div class="dashboard-stat"><strong>${completedLevels}/${totalLevels}</strong><span>Levels completed</span></div>
            <div class="dashboard-stat"><strong>${completedTasks}/${totalTasks}</strong><span>Task leaves lit</span></div>
            <div class="dashboard-stat"><strong>${trainedSkills}</strong><span>Skills touched</span></div>
            <div class="dashboard-stat"><strong>${overallPercent}%</strong><span>Tree growth</span></div>
        </div>
    `;

    dashboardSkillCloud.innerHTML = renderPracticePatternTree(topicTrees);

    dashboardTopicTable.innerHTML = `
        <div class="learning-tree">
            <div class="tree-legend">
                <span class="legend-item"><span class="tree-node done">OK</span>Completed</span>
                <span class="legend-item"><span class="tree-node next">N</span>Current / next</span>
                <span class="legend-item"><span class="tree-node ready">R</span>Ready</span>
                <span class="legend-item"><span class="tree-node">L</span>Locked</span>
            </div>
            ${topicTrees.map(renderTopicTree).join("")}
        </div>
    `;
}

function renderQuestionBank() {
    if (!questionBankContent) return;

    const completed = getCompletedMissions();
    const topicCards = STUDENT_TOPIC_ORDER
        .filter(topicId => LESSONS[topicId])
        .map(topicId => renderQuestionBankTopic(topicId, completed))
        .join("");

    questionBankContent.innerHTML = `
        <div class="question-bank">
            <div class="bank-toolbar">
                <span><strong>Full question bank:</strong> every stored task is shown here. Dashboard only shows the current training batch.</span>
                <button class="secondary-btn bank-refresh-topic" type="button" data-bank-refresh-topic="${escapeHtml(activeLessonId)}">Update Current Topic</button>
            </div>
            ${topicCards}
        </div>
    `;
}

function renderQuestionBankTopic(topicId, completed = getCompletedMissions()) {
    const topic = LESSONS[topicId] || {};
    const groups = getLevelGroupsForTopic(topicId);
    const progress = getTopicProgress(topicId);
    const batch = getTopicBatch(topicId);
    const batchComplete = progress.totalCount > 0 && progress.completedCount === progress.totalCount;
    const batchLabel = batchComplete
        ? "Current set completed"
        : `${progress.completedCount}/${progress.totalCount} current levels completed`;
    const setCount = getQuestionSetsForTopic(topicId).length;

    return `
        <article class="bank-topic ${topicId === activeLessonId ? "active" : ""}">
            <div class="bank-topic-head">
                <div class="bank-topic-title">
                    <strong>${escapeHtml(topic.title || topicId)}</strong>
                    <span>${escapeHtml(batchLabel)} | Current: ${escapeHtml(batch.setTitle || batch.setId || "Set")} | ${setCount} total sets</span>
                </div>
                <button class="secondary-btn bank-refresh-topic" type="button" data-bank-refresh-topic="${escapeHtml(topicId)}">Update Questions</button>
            </div>
            <div class="bank-levels">
                ${groups.map(group => renderQuestionBankLevel(topicId, group, completed)).join("")}
            </div>
        </article>
    `;
}

function renderQuestionBankLevel(topicId, group, completed = getCompletedMissions()) {
    const currentBatchIds = new Set(getTopicBatch(topicId).taskIds || []);
    const currentTasks = group.tasks.filter(task => currentBatchIds.has(task.id));
    const currentCompleted = currentTasks.filter(task => isTaskCompletedInCurrentBatch(topicId, task.id, completed)).length;
    const levelComplete = currentTasks.length > 0 && currentCompleted === currentTasks.length;

    return `
        <section class="bank-level">
            <div class="bank-level-head">
                <span>Level ${group.level}: ${escapeHtml(LEVEL_STAGE_LABELS[group.level - 1] || `Level ${group.level}`)}</span>
                <span>${currentTasks.length ? `${currentCompleted}/${currentTasks.length} current` : "Not in current set"}${levelComplete ? " | complete" : ""}</span>
            </div>
            <div class="bank-task-grid">
                ${group.tasks.map(task => renderQuestionBankTask(topicId, task, completed)).join("")}
            </div>
        </section>
    `;
}

function renderQuestionBankTask(topicId, task, completed = getCompletedMissions()) {
    const inCurrentBatch = isTaskInCurrentBatch(topicId, task.id);
    const completedInBatch = inCurrentBatch && isTaskCompletedInCurrentBatch(topicId, task.id, completed);
    const level = getTaskLevelNumber(task);
    const status = completedInBatch
        ? "Completed in current set"
        : inCurrentBatch
            ? "In current training batch"
            : "Stored in full bank";

    return `
        <div class="bank-task ${inCurrentBatch ? "current-batch" : ""} ${completedInBatch ? "completed" : ""}">
            <strong>Level ${level}: ${escapeHtml(task.title || "Practice task")}</strong>
            <span>${escapeHtml(task.setTitle || task.setId || "Question set")}</span>
            <span>${escapeHtml(status)}</span>
            <span>${escapeHtml(task.taskType || "practice")}</span>
        </div>
    `;
}

function renderPracticePatternTree(topicTrees) {
    const layout = buildPracticePatternTreeLayout(topicTrees);
    const links = layout.links.map(link => renderPracticeTreeLink(link)).join("");
    const taskNodes = layout.tasks.map(node => renderPracticeTreeNode(node)).join("");
    const levelNodes = layout.levels.map(node => renderPracticeTreeNode(node)).join("");
    const topicNodes = layout.topics.map(node => renderPracticeTreeNode(node)).join("");
    const rootNode = renderPracticeTreeNode(layout.root);

    return `
        <div class="practice-tree-panel">
            <div class="practice-tree-copy">Root -> Practice Pattern -> Level -> Task. The diagram is generated from the same topic, level, and task data used by Practice Path.</div>
            <div class="practice-tree-scroll" aria-label="Practice pattern tree">
                <svg class="practice-tree-svg" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="Practice pattern learning tree">
                    <rect class="practice-tree-bg" x="0" y="0" width="${layout.width}" height="${layout.height}" rx="12"></rect>
                    <g class="practice-tree-links">${links}</g>
                    <g class="practice-tree-nodes">${rootNode}${topicNodes}${levelNodes}${taskNodes}</g>
                </svg>
            </div>
        </div>
    `;
}

function buildPracticePatternTreeLayout(topicTrees) {
    const rootY = 60;
    const topicY = 164;
    const levelY = 304;
    const taskY = 438;
    const sidePadding = 110;
    const topicGap = 70;
    const taskGap = 42;
    const minLevelWidth = 100;
    const links = [];
    const topics = [];
    const levels = [];
    const tasks = [];
    const topicLayouts = topicTrees.map(topic => {
        const levelWidths = topic.levels.map(level => Math.max(minLevelWidth, level.taskCount * taskGap + 34));
        const width = Math.max(320, levelWidths.reduce((sum, value) => sum + value, 0) + 64);
        return { topic, levelWidths, width };
    });
    const width = Math.max(1180, sidePadding * 2 + topicLayouts.reduce((sum, item) => sum + item.width, 0) + Math.max(0, topicLayouts.length - 1) * topicGap);
    const maxTasksInLevel = Math.max(1, ...topicTrees.flatMap(topic => topic.levels.map(level => level.taskCount || 1)));
    const height = taskY + 112 + Math.max(0, maxTasksInLevel - 4) * 16;
    const root = {
        kind: "root",
        x: width / 2,
        y: rootY,
        r: 24,
        label: "Start",
        subLabel: `${topicTrees.length} patterns`,
        state: topicTrees.every(topic => topic.isComplete) ? "done" : "next"
    };

    let cursor = sidePadding;
    topicLayouts.forEach(({ topic, levelWidths, width: topicWidth }) => {
        const topicCenterX = cursor + topicWidth / 2;
        const topicState = topic.isComplete ? "done" : topic.isActive ? "next" : "ready";
        const topicNode = {
            kind: "topic",
            x: topicCenterX,
            y: topicY,
            r: 18,
            label: truncateLabel(topic.title, 18),
            subLabel: `${topic.completedTaskCount}/${topic.taskCount}`,
            title: topic.title,
            state: topicState
        };
        topics.push(topicNode);
        links.push({ from: root, to: topicNode, state: topicState === "locked" ? "locked" : topicState });

        let levelCursor = cursor + (topicWidth - levelWidths.reduce((sum, value) => sum + value, 0)) / 2;
        topic.levels.forEach((level, levelIndex) => {
            const levelWidth = levelWidths[levelIndex];
            const levelX = levelCursor + levelWidth / 2;
            const levelState = level.isComplete ? "done" : level.isCurrent ? "next" : level.isReady ? "ready" : "locked";
            const levelNode = {
                kind: "level",
                x: levelX,
                y: levelY,
                r: 15,
                label: `L${level.level}`,
                subLabel: `${level.completedCount}/${level.taskCount}`,
                title: `${topic.title} - Level ${level.level}: ${level.stage}`,
                state: levelState
            };
            levels.push(levelNode);
            links.push({ from: topicNode, to: levelNode, state: levelState });

            level.tasks.forEach((item, taskIndex) => {
                const taskX = levelX + (taskIndex - (level.tasks.length - 1) / 2) * taskGap;
                const taskState = item.completed ? "done" : item.current ? "next" : item.ready ? "ready" : "locked";
                const taskNode = {
                    kind: "task",
                    x: taskX,
                    y: taskY,
                    r: 9,
                    label: String(taskIndex + 1),
                    subLabel: "",
                    title: `${topic.title} - Level ${level.level}: ${item.task.title}`,
                    state: taskState,
                    topicId: topic.topicId,
                    taskId: item.task.id,
                    ready: item.ready
                };
                tasks.push(taskNode);
                links.push({ from: levelNode, to: taskNode, state: taskState });
            });

            levelCursor += levelWidth;
        });

        cursor += topicWidth + topicGap;
    });

    return { root, topics, levels, tasks, links, width: Math.round(width), height };
}

function renderPracticeTreeLink(link) {
    const midY = (link.from.y + link.to.y) / 2;
    const d = `M ${link.from.x} ${link.from.y + link.from.r} C ${link.from.x} ${midY}, ${link.to.x} ${midY}, ${link.to.x} ${link.to.y - link.to.r}`;
    return `<path class="practice-tree-link ${escapeHtml(link.state)}" d="${d}"></path>`;
}

function renderPracticeTreeNode(node) {
    const dataAttrs = node.kind === "task"
        ? ` data-pattern-topic="${escapeHtml(node.topicId)}" data-pattern-task="${escapeHtml(node.taskId)}" data-pattern-ready="${node.ready ? "true" : "false"}"`
        : "";
    const labelY = node.y + node.r + (node.kind === "task" ? 17 : 18);
    const subLabel = node.subLabel
        ? `<text class="practice-tree-sub-label" x="${node.x}" y="${labelY + 13}">${escapeHtml(node.subLabel)}</text>`
        : "";

    return `
        <g class="practice-tree-node ${escapeHtml(node.kind)} ${escapeHtml(node.state)}"${dataAttrs}>
            <title>${escapeHtml(node.title || node.label)}</title>
            <circle cx="${node.x}" cy="${node.y}" r="${node.r}"></circle>
            <text class="practice-tree-node-label" x="${node.x}" y="${node.y + 4}">${escapeHtml(node.label)}</text>
            ${node.kind === "task" ? "" : `<text class="practice-tree-label" x="${node.x}" y="${labelY}">${escapeHtml(node.label)}</text>`}
            ${subLabel}
        </g>
    `;
}

function truncateLabel(label, maxLength) {
    const text = String(label || "");
    return text.length <= maxLength ? text : `${text.slice(0, Math.max(1, maxLength - 1))}.`;
}

function buildTopicTree(topicId, completed = getCompletedMissions()) {
    const tasks = getTasksForTopic(topicId);
    const levels = [];
    const levelMap = new Map();

    tasks.forEach((task, index) => {
        const levelNumber = getTaskLevelNumber(task, index);
        if (!levelMap.has(levelNumber)) {
            const level = {
                level: levelNumber,
                stage: LEVEL_STAGE_LABELS[levelNumber - 1] || `Level ${levelNumber}`,
                tasks: []
            };
            levelMap.set(levelNumber, level);
            levels.push(level);
        }
        levelMap.get(levelNumber).tasks.push(task);
    });

    levels.sort((a, b) => a.level - b.level);
    levels.forEach((level, index) => {
        const previousLevel = levels[index - 1] || null;
        const previousComplete = previousLevel ? previousLevel.isComplete : true;
        level.tasks = level.tasks.map(task => {
            const key = getTaskKey(topicId, task.id);
            const completedTask = isTaskCompletedInCurrentBatch(topicId, task.id, completed);
            const current = topicId === activeLessonId && task.id === activeTaskId;
            return {
                task,
                key,
                completed: completedTask,
                current,
                ready: completedTask || previousComplete || current
            };
        });
        level.completedCount = level.tasks.filter(item => item.completed).length;
        level.taskCount = level.tasks.length;
        level.isComplete = level.taskCount > 0 && level.completedCount === level.taskCount;
        level.isCurrent = level.tasks.some(item => item.current);
        level.isReady = !level.isComplete && (previousComplete || level.isCurrent);
    });

    const nextLevel = levels.find(level => !level.isComplete && level.isReady) || null;
    const completedCount = levels.filter(level => level.isComplete).length;
    const taskCount = levels.reduce((sum, level) => sum + level.taskCount, 0);
    const completedTaskCount = levels.reduce((sum, level) => sum + level.completedCount, 0);

    return {
        topicId,
        title: LESSONS[topicId]?.title || topicId,
        levels,
        completedCount,
        totalCount: levels.length,
        taskCount,
        completedTaskCount,
        nextLevel,
        isComplete: levels.length > 0 && levels.every(level => level.isComplete),
        isActive: topicId === activeLessonId,
        percent: levels.length ? Math.round((completedCount / levels.length) * 100) : 0
    };
}

function getTaskLevelNumber(task, fallbackIndex = 0) {
    const typeMatch = String(task?.taskType || "").match(/level-(\d+)/i);
    if (typeMatch) return Number(typeMatch[1]);
    const idMatch = String(task?.id || "").match(/-l(\d+)-/i);
    if (idMatch) return Number(idMatch[1]);
    return fallbackIndex + 1;
}

function renderTopicTree(topic) {
    const topicNodeClass = topic.isComplete ? "done" : topic.nextLevel ? "next" : "";
    const topicState = topic.isComplete
        ? "Complete"
        : topic.nextLevel
            ? `${topic.nextLevel.stage} is next`
            : "Not started";

    return `
        <article class="tree-topic-card ${topic.isActive ? "active" : ""}">
            <div class="tree-topic-head">
                <span class="tree-node ${topicNodeClass}">${topic.isComplete ? "OK" : topic.completedCount || "N"}</span>
                <div class="tree-topic-title">
                    <strong>${escapeHtml(topic.title)}</strong>
                    <span>${topic.completedTaskCount}/${topic.taskCount} task leaves lit | ${topic.completedCount}/${topic.totalCount} level nodes lit</span>
                </div>
                <div class="tree-topic-state">${escapeHtml(topicState)}</div>
            </div>
            <div class="tree-levels">
                ${topic.levels.map(level => renderTreeLevel(topic.topicId, level)).join("")}
            </div>
        </article>
    `;
}

function renderTreeLevel(topicId, level) {
    const levelNodeClass = level.isComplete ? "done" : level.isCurrent ? "next" : level.isReady ? "ready" : "";
    const statusText = level.isComplete
        ? "Completed"
        : level.isCurrent
            ? "Current"
            : level.isReady
                ? "Ready"
                : "Locked";

    return `
        <div class="tree-level">
            <span class="tree-node ${levelNodeClass}">${level.isComplete ? "OK" : level.level}</span>
            <div class="tree-level-body">
                <div class="tree-level-head">
                    <strong>Level ${level.level}: ${escapeHtml(level.stage)}</strong>
                    <span>${level.completedCount}/${level.taskCount} tasks | ${statusText}</span>
                </div>
                <div class="tree-tasks">
                    ${level.tasks.map(item => renderTreeTask(topicId, level, item)).join("")}
                </div>
            </div>
        </div>
    `;
}

function renderTreeTask(topicId, level, item) {
    const stateClass = item.completed ? "completed" : item.current ? "current" : item.ready ? "ready" : "locked";
    const stateLabel = item.completed ? "Completed" : item.current ? "Current" : item.ready ? "Ready" : "Locked";
    const disabled = item.ready ? "" : "disabled";

    return `
        <button class="tree-task ${stateClass}" type="button"
            data-tree-topic="${escapeHtml(topicId)}"
            data-tree-task="${escapeHtml(item.task.id)}"
            ${disabled}>
            <span class="tree-task-dot"></span>
            <span class="tree-task-text">
                <strong>${escapeHtml(item.task.title || `Level ${level.level} task`)}</strong>
                <span>${escapeHtml(stateLabel)} | ${escapeHtml(item.task.taskType || "practice")}</span>
            </span>
        </button>
    `;
}

function renderCodeQualityPanel(task) {
    const quality = analyzeCodeQuality(codeInput.value, task, lastLessonResult);
    const rows = quality.items.map(item => `
        <div class="quality-item ${item.passed ? "pass" : "fix"}">
            <span>${escapeHtml(item.label)}</span>
            <span>${item.passed ? "OK" : "Review"}</span>
        </div>
    `).join("");

    return `
        <div class="quality-grid">
            <div class="mode-panel-title">Quality Signal: ${quality.score}/100</div>
            ${rows}
        </div>
    `;
}

function analyzeCodeQuality(code, task, result) {
    const nonEmptyLines = code.split('\n').map(line => line.trim()).filter(Boolean);
    const duplicateLines = nonEmptyLines.length - new Set(nonEmptyLines).size;
    const singleLetterAssignments = nonEmptyLines.filter(line => /^[a-z]\s*=/.test(line)).length;
    const starterLineCount = (task?.starterCode || "").split('\n').filter(line => line.trim()).length;
    const items = [
        { label: "Goal is verified by the trace", passed: Boolean(result?.passed) },
        { label: "No placeholder pass remains", passed: !/\bpass\b/.test(code) },
        { label: "Low duplicate-line noise", passed: duplicateLines <= 1 },
        { label: "Readable variable names", passed: singleLetterAssignments <= 1 },
        { label: "Change size stays focused", passed: nonEmptyLines.length <= starterLineCount + 5 }
    ];
    const score = Math.round((items.filter(item => item.passed).length / items.length) * 100);
    return { score, items };
}

function getMissingBlanks(task = getActiveTask()) {
    if (!task?.blanks?.length) return [];
    return task.blanks.filter(blank => !getBlankValue(blank.token).trim());
}

function canCompileActiveTask() {
    return getMissingBlanks().length === 0;
}

function renderBlankRequirements(task) {
    if (!task?.blanks?.length) return "";

    const missingBlanks = getMissingBlanks(task);
    const missingTokens = new Set(missingBlanks.map(blank => blank.token));
    const blankRows = task.blanks.map(blank => {
        const isFilled = !missingTokens.has(blank.token);
        const value = getBlankValue(blank.token);
        return `<div class="blank-row ${isFilled ? "filled" : "missing"}">
            <span>${escapeHtml(blank.token)}</span>
            <span>${escapeHtml(blank.label)}</span>
            <input class="blank-input" type="text" autocomplete="off"
                data-blank-token="${escapeHtml(blank.token)}"
                value="${escapeHtml(value)}"
                placeholder="Type Python code here">
            <strong>${isFilled ? "filled" : "required"}</strong>
        </div>`;
    }).join("");

    return `
        <div class="blank-panel" id="blank-panel">
            <div class="blank-title">Fill-in-the-blank gate</div>
            <div class="blank-help">Type each answer here. Code updates automatically, so you do not need to delete ${escapeHtml(task.blanks[0]?.token || "the blank token")} in the editor. For strings, include quotes, for example "Ada".</div>
            ${blankRows}
        </div>
    `;
}

function updateRunAvailability() {
    const task = getActiveTask();
    if (task?.blanks?.length && !canCompileActiveTask()) {
        btnRun.disabled = true;
        btnRun.textContent = "Fill Blanks First";
        return;
    }

    btnRun.disabled = false;
    btnRun.textContent = "Compile & Run";
}

function renderTopicInfo() {
    const details = TOPIC_DETAILS[activeLessonId] || {};
    const topic = LESSONS[activeLessonId] || {};

    if (topicBrief) {
        topicBrief.innerHTML = `<strong>${escapeHtml(topic.title || "Topic")}</strong><br>${escapeHtml(details.brief || "No topic summary available.")}`;
    }

    if (algorithmIntro) {
        algorithmIntro.innerHTML = `<strong>Algorithm pattern</strong><br>${escapeHtml(details.algorithm || "No algorithm summary available.")}`;
    }
}

function goToMissionTask(topicId, taskId) {
    if (!LESSONS[topicId]) return;
    activeLessonId = topicId;
    lessonSelect.value = topicId;
    populateTaskSelect(topicId);
    setActiveTask(taskId, false);
    logStudentAction("button", "Mission Level", {
        selectedTopicId: topicId,
        selectedTaskId: taskId
    });
}

function submitDebugReport() {
    const meta = getTaskMeta();
    const reason = document.getElementById("debug-reason")?.value.trim() || "";

    if (!selectedBugLine) {
        debugReportFeedback = { kind: "needs-work", text: "Choose the suspicious line before submitting the report." };
        renderLessonGoal();
        return;
    }

    if (!reason) {
        debugReportFeedback = { kind: "needs-work", text: "Add a short explanation of what goes wrong in the program state." };
        renderLessonGoal();
        return;
    }

    const expectedLine = meta.debug?.line;
    const lineCorrect = expectedLine ? selectedBugLine === expectedLine : true;
    const explanationReady = reason.length >= 12;
    const passed = lineCorrect && explanationReady;
    debugReportFeedback = passed
        ? { kind: "good", text: `Good report. ${meta.debug?.cause || "Now repair the code and confirm it with the trace."}` }
        : { kind: "needs-work", text: "Not quite. Compare the selected line with the final-value goal and the variable change shown in the trace." };

    logStudentAction("button", "Submit Bug Report", {
        selectedBugLine,
        expectedLine,
        reason,
        result: passed ? "passed" : "needs-work"
    });
    renderLessonGoal();
}

function syncReviewSelections() {
    reviewSelections = new Set(
        [...lessonGoal.querySelectorAll(".review-check:checked")].map(input => input.value)
    );
}

function submitReview() {
    const meta = getTaskMeta();
    const review = meta.aiReview || {};
    const concerns = review.concerns || [
        { id: "trace-needed", expected: true },
        { id: "readability", expected: true },
        { id: "always-shorter", expected: false }
    ];
    syncReviewSelections();

    const expected = new Set(concerns.filter(item => item.expected).map(item => item.id));
    const selected = reviewSelections;
    const missed = [...expected].filter(id => !selected.has(id));
    const extras = [...selected].filter(id => !expected.has(id));
    const passed = missed.length === 0 && extras.length === 0;

    reviewFeedback = passed
        ? { kind: "good", text: "Strong review. You identified the important code-quality risks for this task." }
        : { kind: "needs-work", text: "Review again. Look for correctness evidence, accumulator behavior, edge cases, and whether the trace proves the goal." };

    logStudentAction("button", "Submit AI Review", {
        selected: [...selected],
        expected: [...expected],
        missed,
        extras,
        result: passed ? "passed" : "needs-work"
    });
    renderLessonGoal();
}

function recordLearningProgress(task, result) {
    if (!result?.passed || !task) return;
    markMissionCompleted(activeLessonId, task.id);
    updateSkillProgressForTask(task, result);
    renderDashboard();
    renderQuestionBank();
}

function resetAllProgress() {
    localStorage.removeItem(MISSION_PROGRESS_KEY);
    localStorage.removeItem(SKILL_PROGRESS_KEY);
    localStorage.removeItem(TOPIC_BATCH_KEY);
    localStorage.removeItem("ssp_v8_completed_levels");
    localStorage.removeItem("ssp_v8_skill_progress");
    localStorage.removeItem("ssp_v7_completed_levels");
    localStorage.removeItem("ssp_v7_skill_progress");
    localStorage.removeItem("ssp_v6_completed_missions");
    localStorage.removeItem("ssp_v6_skill_progress");
    localStorage.removeItem(GUIDE_KEY);
    predictionAttempts = [];
    exerciseTrainingRecords = [];
    studentActionLog = [];
    resetModeInteractionState();
    const firstMission = getFirstAvailableMission(activeLessonId);
    if (firstMission) {
        populateTaskSelect(activeLessonId);
        setActiveTask(firstMission.taskId, false);
    } else {
        resetTimelineState();
        renderLessonGoal();
    }
    renderDashboard();
    renderQuestionBank();
    renderTeacherInsights();
    logStudentAction("button", "Reset Progress", { result: "cleared" });
    consoleOutput.innerHTML = `<div class="console-row muted">Progress has been reset. Choose a Practice Topic and run a level to start again.</div>`;
}

function renderExecutionError(message) {
    const isPythonSetupIssue = /Python tracing engine could not start|python|py -3/i.test(message);
    const setupHelp = isPythonSetupIssue
        ? `<div class="console-row muted">Install Python 3, then confirm one of these works in PowerShell: python --version or py --version.</div>`
        : "";

    consoleOutput.innerHTML = `
        <div class="console-row error">Execution could not finish.</div>
        <div class="console-row error-detail">${escapeHtml(message)}</div>
        ${setupHelp}
    `;
}

function setCodeForWalkthrough(code) {
    codeInput.value = code;
    resetTimelineState();
    renderLessonGoal();
    updateRunAvailability();
    syncEditorRendering();
}

async function runWalkthrough(modeId) {
    const demo = WALKTHROUGH_DEMOS[modeId];
    if (!demo) return;

    activeWalkthroughMode = modeId;
    walkthroughFeedback = "Preparing the guided example...";
    activeLearningMode = modeId;
    modeSelect.value = modeId;

    setActiveLesson(demo.topicId, false);
    setActiveTask(demo.taskId, false);
    activeWalkthroughMode = modeId;
    walkthroughFeedback = "The walkthrough is now performing the steps shown above.";
    renderLessonGoal();

    if (modeId === "debug") {
        selectedBugLine = demo.bugLine;
        renderLessonGoal();
        const reasonInput = document.getElementById("debug-reason");
        if (reasonInput) reasonInput.value = demo.bugReason;
        submitDebugReport();
    }

    if (modeId === "aiReview") {
        const meta = getTaskMeta();
        const expectedConcernIds = (meta.aiReview?.concerns || [])
            .filter(item => item.expected)
            .map(item => item.id);
        reviewSelections = new Set(expectedConcernIds);
        renderLessonGoal();
        lessonGoal.querySelectorAll(".review-check").forEach(input => {
            input.checked = reviewSelections.has(input.value);
        });
        submitReview();
    }

    setCodeForWalkthrough(demo.solutionCode);
    activeWalkthroughMode = modeId;
    walkthroughFeedback = "Running the trace with the demonstrated code...";
    renderLessonGoal();

    const didRun = await runCodeFromEditor(`Walkthrough: ${LEARNING_MODES[modeId]?.title || modeId}`, { skipProgress: true });
    if (!didRun) {
        activeWalkthroughMode = modeId;
        walkthroughFeedback = "The walkthrough reached Compile & Run, but the trace engine returned an error. Read the timeline message for setup details.";
        renderLessonGoal();
        return;
    }

    if (modeId === "prediction") {
        renderFrame(0);
        const frame = pipelineSteps[0];
        const target = getPredictionTarget(frame);
        if (target) {
            predictionInput.value = target.changeType === "removed" ? "removed" : String(target.after);
            checkPrediction();
        }
    }

    activeWalkthroughMode = modeId;
    walkthroughFeedback = "Walkthrough complete. The page now shows the expected state after a correct student flow.";
    renderLessonGoal();
    if (pipelineSteps.length) {
        renderFrame(currentFrameIndex);
    }
    logStudentAction("button", "Walkthrough This Mode", {
        selectedMode: modeId,
        result: "completed"
    });
}

codeInput.addEventListener('input', () => {
    clearWalkthroughState();
    revealedMissionFixes = new Set();
    resetTimelineState();
    renderLessonGoal();
    updateRunAvailability();
});

codeInput.addEventListener('scroll', () => {
    codeViewer.scrollTop = codeInput.scrollTop;
    codeViewer.scrollLeft = codeInput.scrollLeft;
    gutterZone.scrollTop = codeInput.scrollTop;
});

exampleSelect.addEventListener('change', () => {
    setActiveTask(exampleSelect.value, true);
});

btnResetView.addEventListener('click', resetAllProgress);
btnPracticeView?.addEventListener('click', () => setActiveView("practice"));
btnDashboardView?.addEventListener('click', () => setActiveView("dashboard"));
btnQuestionBankView?.addEventListener('click', () => setActiveView("bank"));

modeSelect.addEventListener('change', () => {
    activeLearningMode = modeSelect.value;
    clearWalkthroughState();
    resetModeInteractionState();
    ensureMissionTaskSelected();
    syncModeShell();
    logStudentAction("select", "Learning Mode", {
        selectedMode: activeLearningMode
    });
    resetPredictionPanel();
    renderLessonGoal();
    if (pipelineSteps.length) {
        renderFrame(currentFrameIndex);
    }
});

lessonSelect.addEventListener('change', () => {
    setActiveLesson(lessonSelect.value, true);
});

lessonGoal.addEventListener('click', (event) => {
    const fixButton = event.target.closest(".mission-fix-button");
    if (fixButton) {
        const index = Number(fixButton.dataset.fixIndex);
        if (revealedMissionFixes.has(index)) {
            revealedMissionFixes.delete(index);
        } else {
            revealedMissionFixes.add(index);
        }
        renderLessonGoal();
        return;
    }

    const missionButton = event.target.closest(".mission-card");
    if (missionButton && !missionButton.disabled) {
        goToMissionTask(missionButton.dataset.missionTopic, missionButton.dataset.missionTask);
        return;
    }

    const bugLineButton = event.target.closest(".bug-line-button");
    if (bugLineButton) {
        selectedBugLine = Number(bugLineButton.dataset.bugLine);
        debugReportFeedback = null;
        renderLessonGoal();
        return;
    }

    if (event.target.closest(".debug-submit")) {
        submitDebugReport();
        return;
    }

    if (event.target.closest(".review-submit")) {
        submitReview();
        return;
    }

    const walkthroughButton = event.target.closest(".walkthrough-button");
    if (walkthroughButton) {
        runWalkthrough(walkthroughButton.dataset.walkthroughMode);
    }
});

lessonGoal.addEventListener('change', (event) => {
    if (event.target.classList.contains("review-check")) {
        syncReviewSelections();
    }
});

function handleBlankInput(event) {
    const blankInput = event.target.closest(".blank-input");
    if (!blankInput) return;

    const token = blankInput.dataset.blankToken;
    const caretPosition = blankInput.selectionStart ?? blankInput.value.length;
    blankDraftValues[token] = blankInput.value;
    clearWalkthroughState();
    revealedMissionFixes = new Set();
    codeInput.value = renderCodeWithBlankValues();
    resetTimelineState();
    renderLessonGoal();
    const nextInput = [...(blankSlot || lessonGoal).querySelectorAll(".blank-input")]
        .find(input => input.dataset.blankToken === token);
    if (nextInput) {
        nextInput.focus();
        nextInput.setSelectionRange(caretPosition, caretPosition);
    }
    updateRunAvailability();
}

lessonGoal.addEventListener('input', handleBlankInput);
blankSlot?.addEventListener('input', handleBlankInput);

btnCheckLesson.addEventListener('click', () => {
    if (!pipelineSteps.length) {
        logStudentAction("button", "Student Learning Goal", { result: "no_trace" });
        renderLessonStatus({
            passed: false,
            criteria: [{ passed: false, label: "Run the program before checking the task." }]
        });
        return;
    }
    lastLessonResult = evaluateLesson(getActiveTask(), pipelineSteps, codeInput.value);
    logStudentAction("button", "Student Learning Goal", {
        result: lastLessonResult.passed ? "passed" : "failed",
        criteria: lastLessonResult.criteria
    });
    renderLessonStatus(lastLessonResult);
    renderTeacherInsights();
});

btnExportReport.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleReportExportMenu();
});
btnReportPrint.addEventListener('click', (event) => {
    event.stopPropagation();
    closeReportExportMenu();
    exportTeacherReport("print");
});
btnReportHtml.addEventListener('click', (event) => {
    event.stopPropagation();
    closeReportExportMenu();
    exportTeacherReport("html");
});
questionBankContent?.addEventListener('click', (event) => {
    const refreshButton = event.target.closest(".bank-refresh-topic");
    if (!refreshButton) return;
    refreshTopicPracticeBatch(refreshButton.dataset.bankRefreshTopic);
});
document.addEventListener('click', (event) => {
    if (!exportReportMenu?.classList.contains("open")) return;
    if (exportReportMenu.contains(event.target)) return;
    closeReportExportMenu();
});
btnPresentationMode.addEventListener('click', togglePresentationMode);

function initializeVariableColors(steps) {
    variableColorMap = {};
    let colorIndex = 0;

    steps.forEach(frame => {
        const snapshots = [frame.variables || {}, frame.beforeVariables || {}, frame.afterVariables || {}];
        snapshots.forEach(vars => {
            for (const varName of Object.keys(vars)) {
                if (!variableColorMap[varName]) {
                    variableColorMap[varName] = BRIGHT_PALETTE[colorIndex % BRIGHT_PALETTE.length];
                    colorIndex++;
                }
            }
        });
    });
}

async function runCodeFromEditor(actionLabel = "Compile & Run", options = {}) {
    if (!canCompileActiveTask()) {
        renderLessonGoal();
        updateRunAvailability();
        consoleOutput.innerHTML = `<span style="color: #f4c95d;">Fill every blank token before compiling this task.</span>`;
        return false;
    }

    const code = codeInput.value;
    revealedMissionFixes = new Set();
    logStudentAction("button", actionLabel, {
        codeLength: code.length
    });
    btnRun.textContent = "Running...";
    btnRun.disabled = true;

    try {
        if (window.location.protocol === "file:") {
            throw new Error("The app is opened as a local file. Compile & Run needs the backend server. Open http://127.0.0.1:5057/ after running dotnet run --urls http://127.0.0.1:5057.");
        }

        const response = await fetch('/api/execution/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Backend infrastructure execution alert.");
        }

        pipelineSteps = await response.json();

        if (!pipelineSteps || pipelineSteps.length === 0) {
            throw new Error("No trace telemetry returned.");
        }

        isTimelineActive = true;
        initializeVariableColors(pipelineSteps);

        slider.max = pipelineSteps.length - 1;
        slider.value = 0;
        slider.disabled = pipelineSteps.length <= 1;

        renderFrame(0);
        const task = getActiveTask();
        lastLessonResult = evaluateLesson(task, pipelineSteps, code);
        if (!options.skipProgress) {
            recordLearningProgress(task, lastLessonResult);
        }
        renderLessonStatus(lastLessonResult);
        renderLessonGoal();
        updateRunAvailability();
        exerciseTrainingRecords.push({
            timestamp: new Date().toISOString(),
            topicId: activeLessonId,
            topicTitle: LESSONS[activeLessonId].title,
            taskId: task.id,
            taskTitle: task.title,
            focusConcept: LESSONS[activeLessonId].concept,
            traceSteps: pipelineSteps.length,
            goalPassed: lastLessonResult.passed,
            progressRecorded: !options.skipProgress,
            criteria: lastLessonResult.criteria
        });
        renderTeacherInsights();
        return true;
    } catch (err) {
        isTimelineActive = false;
        variableColorMap = {};
        syncEditorRendering();
        renderConceptTags([]);
        resetPredictionPanel();
        renderLessonStatus(null);
        renderExecutionError(err.message);
        return false;
    } finally {
        updateRunAvailability();
    }
}

btnRun.addEventListener('click', () => runCodeFromEditor());

slider.addEventListener('input', (event) => {
    renderFrame(parseInt(event.target.value));
});

btnCheckPrediction.addEventListener('click', checkPrediction);
btnRevealAnswer.addEventListener('click', revealAnswer);
btnOpenGuide.addEventListener('click', () => startGuide(true));
btnGuideNext.addEventListener('click', advanceGuide);
btnGuidePrev.addEventListener('click', previousGuide);
btnGuideSkip.addEventListener('click', completeGuide);
btnTopicRefresh?.addEventListener('click', acceptTopicRefresh);
btnTopicRepeat?.addEventListener('click', closeTopicCompleteDialog);
topicCompleteOverlay?.addEventListener('click', (event) => {
    if (event.target === topicCompleteOverlay) closeTopicCompleteDialog();
});
dashboardTopicTable?.addEventListener('click', (event) => {
    const taskButton = event.target.closest(".tree-task");
    if (!taskButton || taskButton.disabled) return;
    const topicId = taskButton.dataset.treeTopic;
    const taskId = taskButton.dataset.treeTask;
    if (!topicId || !taskId) return;
    activeLearningMode = "mission";
    modeSelect.value = "mission";
    goToMissionTask(topicId, taskId);
    setActiveView("practice");
});
dashboardSkillCloud?.addEventListener('click', (event) => {
    const taskNode = event.target.closest(".practice-tree-node.task");
    if (!taskNode || taskNode.dataset.patternReady !== "true") return;
    const topicId = taskNode.dataset.patternTopic;
    const taskId = taskNode.dataset.patternTask;
    if (!topicId || !taskId) return;
    activeLearningMode = "mission";
    modeSelect.value = "mission";
    goToMissionTask(topicId, taskId);
    setActiveView("practice");
});
window.addEventListener('resize', positionGuideCard);
window.addEventListener('scroll', positionGuideCard, true);
window.addEventListener('keydown', (event) => {
    if (event.key === "Escape" && presentationMode) {
        setPresentationMode(false);
    }
    if (event.key === "Escape") {
        closeReportExportMenu();
        closeTopicCompleteDialog();
    }
});
predictionInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        checkPrediction();
    }
});

function renderFrame(index) {
    if (!pipelineSteps || pipelineSteps.length === 0 || index >= pipelineSteps.length) return;

    currentFrameIndex = index;

    const frame = pipelineSteps[index];
    const beforeVars = frame.beforeVariables || frame.previousVariables || {};
    const afterVars = frame.afterVariables || frame.variables || {};
    const changes = frame.changes || [];
    predictionTarget = getPredictionTarget(frame);

    renderConsole(frame);
    renderConceptTags(frame.concepts || [], frame.scopeName);

    stepCounter.textContent = `${index + 1}/${pipelineSteps.length}`;

    syncEditorRendering(frame.line);
    renderScopeGrid(afterVars, frame);
    renderPredictionPanel(frame);
}

function renderConsole(frame) {
    const source = frame.sourceLine ? frame.sourceLine.trim() : "";
    const target = getPredictionTarget(frame);
    const showPredictionAnswer = shouldShowPredictionAnswer(frame, target);
    const changeSummary = (frame.changes || []).length
        ? frame.changes.map(change => {
            const beforeValue = change.changeType === "initialized" ? "not allocated" : change.before;
            const shouldMask = target && change.name === target.name && !showPredictionAnswer;
            const afterValue = shouldMask
                ? "hidden until prediction is checked"
                : change.changeType === "removed" ? "removed" : change.after;
            return `${change.name}: ${beforeValue} -> ${afterValue}`;
        }).join("; ")
        : "No tracked variable change";

    const rows = [
        `<div class="console-row trace-head">Step ${escapeHtml(frame.stepNumber)} / Line ${escapeHtml(frame.line)}</div>`,
        `<div class="console-row trace-line">code: ${escapeHtml(source || "(program transition)")}</div>`,
        `<div class="console-row trace-change">change: ${escapeHtml(changeSummary)}</div>`
    ];

    if (frame.stdout) {
        const stdoutRows = String(frame.stdout).trimEnd().split('\n');
        rows.push(`<div class="console-row trace-output-label">stdout</div>`);
        rows.push(...stdoutRows.map(line => `<div class="console-row">${escapeHtml(line)}</div>`));
    }

    const explanation = formatExplanation(frame, target, showPredictionAnswer);
    if (explanation) {
        rows.push(`<div class="console-row trace-output-label">step explanation</div>`);
        rows.push(`<div class="console-row trace-explanation">${explanation}</div>`);
    }

    consoleOutput.innerHTML = rows.join('');

    if (frame.error) {
        const title = frame.friendlyErrorTitle || frame.errorType || "Runtime Error";
        const message = frame.friendlyErrorMessage || frame.error;
        consoleOutput.innerHTML += `
            <div class="console-row error">${escapeHtml(title)}</div>
            <div class="console-row error-detail">${escapeHtml(message)}</div>
            <div class="console-row muted">Raw: ${escapeHtml(frame.error)}</div>
        `;
    }
}

function formatExplanation(frame, target = null, showTargetAnswer = true) {
    let processedExplanation = escapeHtml(frame.explanation || "");
    if (target && !showTargetAnswer) {
        const answerText = escapeHtml(String(target.changeType === "removed" ? "removed" : target.after));
        if (answerText) {
            const quotedAnswer = `&quot;${answerText}&quot;`;
            processedExplanation = processedExplanation.replace(
                new RegExp(escapeRegExp(quotedAnswer), "g"),
                "&quot;hidden until prediction is checked&quot;"
            );
        }
    }
    for (const [varName, color] of Object.entries(variableColorMap)) {
        const regex = new RegExp(`\`${escapeRegExp(escapeHtml(varName))}\``, 'g');
        processedExplanation = processedExplanation.replace(regex, `<code style="color: ${color}; background: rgba(255,255,255,0.05); padding: 2px 4px; border-radius:3px;">${escapeHtml(varName)}</code>`);
    }
    return processedExplanation;
}

function renderConceptTags(concepts, scopeName = "") {
    if (!conceptPanel) return;

    const tags = [...(concepts || [])];
    if (scopeName && scopeName !== "<module>") {
        tags.push(`Scope: ${scopeName}`);
    }

    if (tags.length === 0) {
        conceptPanel.innerHTML = `<div class="concept-empty">No concept tag for this step yet.</div>`;
        return;
    }

    conceptPanel.innerHTML = tags
        .map(concept => `<span class="concept-chip">${escapeHtml(concept)}</span>`)
        .join('');
}

function renderScopeGrid(vars, frame = null) {
    scopeGrid.innerHTML = '';
    const target = getPredictionTarget(frame);
    const hideVariables = shouldHideVariablesForPrediction(frame, target);
    if (variablesBox) {
        variablesBox.classList.toggle("hidden-for-prediction", hideVariables);
    }
    if (traceLayout) {
        traceLayout.classList.toggle("prediction-only", hideVariables);
    }

    if (hideVariables) {
        return;
    }

    if (Object.keys(vars).length === 0) {
        scopeGrid.innerHTML = `<div style="color: #91a39a; font-size: 12px; font-style: italic;">Run the code to see variable values.</div>`;
        return;
    }

    const hidePredictionAnswer = target && !shouldShowPredictionAnswer(frame, target);
    const changedNames = new Set((frame?.changes || []).map(change => change.name));

    for (const [key, value] of Object.entries(vars)) {
        const varColor = variableColorMap[key] || "#c9d1d9";
        const displayValue = hidePredictionAnswer && key === target.name ? "hidden until checked" : value;
        const card = document.createElement('div');
        card.className = `variable-card ${changedNames.has(key) ? "changed" : ""}`;
        card.style.border = `1px solid ${varColor}`;
        card.style.background = `rgba(${hexToRgb(varColor)}, 0.04)`;
        card.innerHTML = `<span class="name" style="color: ${varColor}">${escapeHtml(key)}</span> = <span class="value" style="color: #ffffff; font-weight: bold; background: rgba(${hexToRgb(varColor)}, 0.2); padding: 1px 6px; border-radius: 4px;">${escapeHtml(displayValue)}</span>`;
        scopeGrid.appendChild(card);
    }
}

function renderPredictionPanel(frame) {
    if (activeLearningMode !== "prediction") {
        setPredictionLabVisible(false);
        predictionTarget = null;
        predictionInput.value = "";
        predictionFeedback.textContent = "";
        btnCheckPrediction.disabled = true;
        btnRevealAnswer.disabled = true;
        return;
    }

    const target = getPredictionTarget(frame);

    predictionTarget = target || null;
    predictionInput.value = "";
    predictionFeedback.textContent = "";
    predictionFeedback.className = "prediction-feedback";
    btnCheckPrediction.disabled = false;
    btnRevealAnswer.disabled = !target;

    if (!target) {
        setPredictionLabVisible(false);
        return;
    }

    if (shouldShowPredictionAnswer(frame, target)) {
        setPredictionLabVisible(false);
        return;
    }

    setPredictionLabVisible(true);
    const attemptCount = predictionAttemptCounts[getPredictionKey(frame, target)] || 0;
    predictionPrompt.textContent = `Guess the new value of ${target.name}. Attempts used: ${attemptCount}/3.`;
}

function checkPrediction() {
    const frame = pipelineSteps[currentFrameIndex];
    if (!frame) {
        logStudentAction("button", "Check Guess", { result: "no_trace" });
        predictionFeedback.textContent = "Run the code first, then check a prediction.";
        predictionFeedback.className = "prediction-feedback muted";
        return;
    }

    if (!predictionTarget) {
        predictionTarget = getPredictionTarget(frame);
    }

    if (!predictionTarget) {
        logStudentAction("button", "Check Guess", {
            result: "no_variable_change",
            stepNumber: frame.stepNumber,
            line: frame.line
        });
        predictionFeedback.textContent = "This step does not change a tracked variable, so there is nothing to check.";
        predictionFeedback.className = "prediction-feedback muted";
        return;
    }

    const guess = predictionInput.value.trim();
    const expected = predictionTarget.changeType === "removed" ? "removed" : String(predictionTarget.after).trim();
    const isCorrect = guess === expected;
    const predictionKey = getPredictionKey(frame, predictionTarget);
    const attemptNumber = (predictionAttemptCounts[predictionKey] || 0) + 1;
    predictionAttemptCounts[predictionKey] = attemptNumber;
    const answerShouldBeShown = isCorrect || attemptNumber >= 3;

    if (answerShouldBeShown) {
        revealedPredictionKeys.add(predictionKey);
    }

    predictionAttempts.push({
        timestamp: new Date().toISOString(),
        topicId: activeLessonId,
        topicTitle: LESSONS[activeLessonId]?.title || "",
        taskId: getActiveTask()?.id || "",
        taskTitle: getActiveTask()?.title || "",
        contentMode: activeContentMode,
        correct: isCorrect,
        attemptNumber,
        answerShown: answerShouldBeShown,
        stepNumber: frame.stepNumber,
        line: frame.line,
        sourceLine: frame.sourceLine,
        scopeName: frame.scopeName,
        concepts: frame.concepts || [],
        variable: predictionTarget.name,
        guess,
        expected
    });

    logStudentAction("button", "Check Guess", {
        result: isCorrect ? "correct" : "wrong",
        attemptNumber,
        answerShown: answerShouldBeShown,
        stepNumber: frame.stepNumber,
        line: frame.line,
        variable: predictionTarget.name,
        guess
    });

    if (isCorrect) {
        predictionFeedback.textContent = `Correct. The correct answer is ${expected}.`;
        predictionFeedback.className = "prediction-feedback good";
    } else if (attemptNumber >= 3) {
        predictionFeedback.textContent = `Not quite. After 3 tries, the correct answer is ${expected}.`;
        predictionFeedback.className = "prediction-feedback needs-work";
    } else {
        predictionFeedback.textContent = `Not quite. Try again before revealing the answer. Attempt ${attemptNumber}/3.`;
        predictionFeedback.className = "prediction-feedback needs-work";
    }
    predictionPrompt.textContent = `Guess the new value of ${predictionTarget.name}. Attempts used: ${attemptNumber}/3.`;

    if (answerShouldBeShown) {
        setPredictionLabVisible(false);
    }

    if (frame) {
        renderConsole(frame);
        renderScopeGrid(frame.afterVariables || frame.variables || {}, frame);
    }
    renderTeacherInsights();
}

function revealAnswer() {
    const frame = pipelineSteps[currentFrameIndex];
    if (!frame) return;

    const target = predictionTarget || getPredictionTarget(frame);
    if (!target) return;

    const expected = target.changeType === "removed" ? "removed" : String(target.after).trim();
    revealedPredictionKeys.add(getPredictionKey(frame, target));
    logStudentAction("button", "Reveal", {
        stepNumber: frame.stepNumber,
        line: frame.line,
        variable: target.name
    });

    predictionFeedback.textContent = `Answer revealed. The correct answer is ${expected}.`;
    predictionFeedback.className = "prediction-feedback muted";
    setPredictionLabVisible(false);
    renderConsole(frame);
    renderScopeGrid(frame.afterVariables || frame.variables || {}, frame);
}

function resetPredictionPanel() {
    predictionTarget = null;
    setPredictionLabVisible(activeLearningMode === "prediction");
    predictionPrompt.textContent = "Run code to make a prediction.";
    predictionInput.value = "";
    predictionInput.disabled = false;
    predictionFeedback.textContent = "";
    predictionFeedback.className = "prediction-feedback";
    btnCheckPrediction.disabled = false;
    btnRevealAnswer.disabled = true;
}

function evaluateLesson(lesson, steps, code = "") {
    const finalVars = getFinalVariables(steps);
    const stdout = getFinalStdout(steps);
    const concepts = getConceptCoverage(steps);
    const hasError = steps.some(step => step.error);
    const goalVariables = getVariableGoalChecks(lesson).map(check => check.variable);

    const criteria = lesson.checks.map(check => {
        if (check.type === "noErrors") {
            return {
                type: check.type,
                passed: !hasError,
                label: hasError ? "Program must finish without errors." : "Program finished without errors.",
                fix: check.fix || lesson.errorFix || "Read the error shown in Step Explanation, repair that line, then click Compile & Run again."
            };
        }

        if (check.type === "variableEquals") {
            const actual = normalizeValue(finalVars[check.variable]);
            const expected = normalizeValue(check.expected);
            return {
                type: check.type,
                variable: check.variable,
                expected,
                actual,
                passed: actual === expected,
                label: `${check.variable} should finish as ${expected}. Actual: ${actual || "not allocated"}.`,
                fix: check.fix || lesson.solution || `Correct target: ${check.variable} must finish as ${expected}. Use the program logic to produce that value, then run again.`
            };
        }

        if (check.type === "stdoutContains") {
            const passed = stdout.includes(check.text);
            return {
                type: check.type,
                passed,
                label: `Console output should include ${check.text}.`,
                fix: check.fix || `Make sure the program prints output containing: ${check.text}.`
            };
        }

        if (check.type === "conceptSeen") {
            const staticConceptEvidence = check.concept === "Accumulator" && hasAccumulatorEvidence(code, goalVariables);
            const passed = concepts.has(check.concept) || staticConceptEvidence;
            const conceptHint = check.concept === "Accumulator"
                ? "Use an accumulator update such as total = total + number, total_sum = total_sum + number, accumulator = total_sum + number followed by total_sum = accumulator, or +=."
                : `Trace should include concept: ${check.concept}.`;
            return {
                type: check.type,
                concept: check.concept,
                passed,
                label: passed ? `Evidence shows concept: ${check.concept}.` : conceptHint,
                fix: check.fix || lesson.algorithmFix || conceptHint
            };
        }

        if (check.type === "codeRegex") {
            const pattern = check.pattern instanceof RegExp ? check.pattern : new RegExp(check.pattern, check.flags || "");
            const passed = pattern.test(code);
            return {
                type: check.type,
                passed,
                label: passed ? check.passLabel || check.label || "Code shape requirement met." : check.label || "Code must use the required pattern.",
                fix: check.fix || lesson.solution || "Refine the code so it uses the required pattern."
            };
        }

        if (check.type === "maxNonEmptyLines") {
            const nonEmptyCount = getCleanCodeLines(code).length;
            const passed = nonEmptyCount <= check.max;
            return {
                type: check.type,
                passed,
                label: passed
                    ? check.passLabel || `Code is concise enough (${nonEmptyCount}/${check.max} non-empty lines).`
                    : check.label || `Refine the code to ${check.max} or fewer non-empty lines. Current: ${nonEmptyCount}.`,
                fix: check.fix || lesson.solution || `Remove repeated statements and express the pattern in ${check.max} or fewer meaningful lines.`
            };
        }

        if (check.type === "errorCategory") {
            const passed = steps.some(step => step.errorCategory === check.expected);
            return {
                type: check.type,
                passed,
                label: passed
                    ? `Trace identified expected error: ${check.expected}.`
                    : `Trace should identify error: ${check.expected}.`,
                fix: check.fix || `Run the code that triggers this expected error category: ${check.expected}.`
            };
        }

        return { passed: false, label: "Unknown check." };
    });

    const shortcutCriteria = getDirectAnswerShortcutCriteria(lesson, code);
    const allCriteria = [...criteria, ...shortcutCriteria];

    return {
        passed: allCriteria.every(item => item.passed),
        criteria: allCriteria,
        finalVars,
        stdout,
        concepts: [...concepts]
    };
}

function getVariableGoalChecks(lesson) {
    return (lesson?.checks || []).filter(check => check.type === "variableEquals");
}

function isDirectAssignmentPractice(lesson) {
    const conceptChecks = (lesson?.checks || []).filter(check => check.type === "conceptSeen");
    return conceptChecks.length === 1 && conceptChecks[0].concept === "Variable assignment";
}

function getCleanCodeLines(code) {
    return String(code || "")
        .split('\n')
        .map((raw, index) => {
            const withoutComment = raw.replace(/#.*$/, "");
            return {
                index: index + 1,
                raw,
                indent: withoutComment.match(/^\s*/)?.[0].length || 0,
                text: withoutComment.trim()
            };
        })
        .filter(line => line.text.length > 0);
}

function hasAccumulatorEvidence(code, goalVariables = []) {
    const lines = getCleanCodeLines(code);
    const goalSet = new Set(goalVariables);

    for (const line of lines) {
        const compoundUpdate = line.text.match(/^([A-Za-z_]\w*)\s*(\+=|-=|\*=|\/=)\s*.+$/);
        if (compoundUpdate && (!goalSet.size || goalSet.has(compoundUpdate[1]))) return true;

        const selfUpdate = line.text.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
        if (selfUpdate) {
            const variable = selfUpdate[1];
            const expression = selfUpdate[2];
            if (
                (!goalSet.size || goalSet.has(variable)) &&
                new RegExp(`\\b${escapeRegExp(variable)}\\b`).test(expression) &&
                /[+\-*]/.test(expression)
            ) {
                return true;
            }
        }
    }

    for (let index = 0; index < lines.length; index += 1) {
        const tempUpdate = lines[index].text.match(/^([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\s*\+\s*.+$/)
            || lines[index].text.match(/^([A-Za-z_]\w*)\s*=\s*.+\+\s*([A-Za-z_]\w*)$/);
        if (!tempUpdate) continue;

        const tempName = tempUpdate[1];
        const baseName = tempUpdate[2];
        if (goalSet.size && !goalSet.has(baseName)) continue;

        const nearbyLines = lines.slice(index + 1, index + 5);
        if (nearbyLines.some(line => new RegExp(`^${escapeRegExp(baseName)}\\s*=\\s*${escapeRegExp(tempName)}$`).test(line.text))) {
            return true;
        }
    }

    return false;
}

function getDirectAnswerShortcutCriteria(lesson, code) {
    if (isDirectAssignmentPractice(lesson)) return [];

    const lines = getCleanCodeLines(code);
    return getVariableGoalChecks(lesson)
        .map(check => {
            const expected = normalizeValue(check.expected);
            const literalPattern = getPythonLiteralPattern(expected);
            const shortcutLine = lines.find(line => {
                if (line.indent !== 0) return false;
                const pattern = new RegExp(`^${escapeRegExp(check.variable)}\\s*=\\s*${literalPattern}$`);
                return pattern.test(line.text);
            });

            if (!shortcutLine) return null;

            return {
                type: "antiShortcut",
                passed: false,
                label: `Avoid shortcut answers: line ${shortcutLine.index} directly sets ${check.variable} to ${expected}.`,
                fix: `Delete the direct final-answer line "${shortcutLine.text}". The program must produce ${check.variable} = ${expected} through the required process.`
            };
        })
        .filter(Boolean);
}

function getPythonLiteralPattern(expected) {
    if (/^-?\d+(\.\d+)?$/.test(expected) || /^(True|False|None)$/.test(expected)) {
        return escapeRegExp(expected);
    }
    return `["']${escapeRegExp(expected)}["']`;
}

function getFinalVariables(steps) {
    if (!steps.length) return {};
    const last = steps[steps.length - 1];
    return last.afterVariables || last.variables || {};
}

function getFinalStdout(steps) {
    if (!steps.length) return "";
    return String(steps[steps.length - 1].stdout || "");
}

function getConceptCoverage(steps) {
    return new Set(steps.flatMap(step => step.concepts || []));
}

function renderLessonStatus(result) {
    if (!result) {
        lessonStatus.innerHTML = `<div class="lesson-status muted">Run the program to check this task against the trace.</div>`;
        return;
    }

    const statusClass = result.passed ? "passed" : "failed";
    const heading = result.passed ? "Task goal met" : "Task goal not met yet";
    lessonStatus.innerHTML = `
        <div class="lesson-status ${statusClass}">
            <strong>${heading}</strong>
            ${result.criteria.map(item => `<div>${item.passed ? "[ok]" : "[fix]"} ${escapeHtml(item.label)}</div>`).join('')}
        </div>
    `;
}

function renderTeacherInsights() {
    if (!teacherInsights) return;

    const wrongAttempts = predictionAttempts.filter(item => !item.correct);
    const failedCriteria = lastLessonResult?.criteria?.filter(item => !item.passed) || [];
    const totalPredictions = predictionAttempts.length;
    const correctPredictions = predictionAttempts.filter(item => item.correct).length;
    const trainedTasks = new Set(exerciseTrainingRecords.map(item => `${item.topicId}:${item.taskId}`)).size;

    if (!wrongAttempts.length && !failedCriteria.length) {
        teacherInsights.innerHTML = `
            <div class="teacher-empty">
                No misunderstanding signal yet. Trained tasks: ${trainedTasks}. Predictions: ${correctPredictions}/${totalPredictions} correct.
            </div>
        `;
        return;
    }

    const wrongHtml = wrongAttempts.map(item => {
        const expectedText = item.answerShown ? item.expected : "hidden until answer is shown";
        return `
        <div class="teacher-insight">
            <strong>Step ${escapeHtml(item.stepNumber)} / Line ${escapeHtml(item.line)}</strong>
            <span>${escapeHtml(item.variable)} guessed "${escapeHtml(item.guess)}", expected "${escapeHtml(expectedText)}".</span>
            <small>${escapeHtml((item.concepts || []).join(", ") || "No concept tag")}</small>
        </div>
    `;
    }).join('');

    const failedHtml = failedCriteria.map(item => `
        <div class="teacher-insight">
            <strong>Goal gap</strong>
            <span>${escapeHtml(item.label)}</span>
        </div>
    `).join('');

    teacherInsights.innerHTML = wrongHtml + failedHtml;
}

function toggleReportExportMenu(forceOpen = null) {
    if (!exportReportMenu || !btnExportReport) return;
    const shouldOpen = forceOpen === null ? !exportReportMenu.classList.contains("open") : Boolean(forceOpen);
    exportReportMenu.classList.toggle("open", shouldOpen);
    btnExportReport.setAttribute("aria-expanded", String(shouldOpen));
}

function closeReportExportMenu() {
    toggleReportExportMenu(false);
}

function populateReportScopeSelect() {
    if (!reportScopeSelect) return;
    const currentValue = reportScopeSelect.value || "all";
    reportScopeSelect.innerHTML = `
        <option value="all">All Practice Topics</option>
        ${STUDENT_TOPIC_ORDER
            .filter(topicId => LESSONS[topicId])
            .map(topicId => `<option value="${escapeHtml(topicId)}">${escapeHtml(LESSONS[topicId].title)}</option>`)
            .join("")}
    `;
    reportScopeSelect.value = [...reportScopeSelect.options].some(option => option.value === currentValue)
        ? currentValue
        : "all";
}

function getSelectedReportScope() {
    const value = reportScopeSelect?.value || "all";
    if (value === "all") {
        return { type: "all", label: "All Practice Topics" };
    }
    return {
        type: "topic",
        topicId: value,
        label: LESSONS[value]?.title || value
    };
}

function exportTeacherReport(mode = "html") {
    const reportScope = getSelectedReportScope();
    const reportData = buildLearningReportData(reportScope);
    const shouldPrint = mode === "print";
    const html = renderLearningReportHtml(reportData, { autoPrint: shouldPrint });
    const opened = openReportHtml(html);

    logStudentAction("button", shouldPrint ? "Print PDF Report" : "Open HTML Report", {
        reportMode: mode,
        reportScope: reportScope.type,
        reportTopicId: reportScope.topicId || "",
        reportOpened: opened
    });

    if (!opened) {
        const scopePart = reportData.scope?.topicId ? `-${reportData.scope.topicId}` : "";
        downloadHtml(`ssp-learning-report${scopePart}-${reportData.fileDate}.html`, html);
    }
}

function buildLearningReportData(scope = { type: "all", label: "All Practice Topics" }) {
    const topicFilter = scope.type === "topic" ? scope.topicId : null;
    const completed = getCompletedMissions();
    const topicRows = STUDENT_TOPIC_ORDER
        .filter(topicId => LESSONS[topicId])
        .filter(topicId => !topicFilter || topicId === topicFilter)
        .map(topicId => buildTopicReportRow(topicId, completed));
    const totalLevels = topicRows.reduce((sum, topic) => sum + topic.totalCount, 0);
    const completedLevels = topicRows.reduce((sum, topic) => sum + topic.completedCount, 0);
    const overallPercent = totalLevels ? Math.round((completedLevels / totalLevels) * 100) : 0;
    const skillProgress = getSkillProgress();
    const skills = SKILL_DEFINITIONS.map(skill => ({
        id: skill.id,
        label: skill.label,
        value: skillProgress[skill.id] || 0
    }));
    const trainedSkills = skills.filter(skill => skill.value > 0).length;
    const scopedRecords = topicFilter
        ? exerciseTrainingRecords.filter(item => item.topicId === topicFilter)
        : exerciseTrainingRecords;
    const scopedPredictions = topicFilter
        ? predictionAttempts.filter(item => item.topicId === topicFilter)
        : predictionAttempts;
    const runCount = scopedRecords.length;
    const passedRuns = scopedRecords.filter(item => item.goalPassed).length;
    const runSuccessRate = runCount ? Math.round((passedRuns / runCount) * 100) : 0;
    const predictionTotal = scopedPredictions.length;
    const predictionCorrect = scopedPredictions.filter(item => item.correct).length;
    const predictionRate = predictionTotal ? Math.round((predictionCorrect / predictionTotal) * 100) : 0;
    const debugRuns = scopedRecords.filter(item => getTaskForReport(item.topicId, item.taskId)?.taskType === "level-5-debug");
    const debugPassed = debugRuns.filter(item => item.goalPassed).length;
    const recentExercises = scopedRecords.slice(-8).reverse().map(buildRecentExerciseRow);
    const signals = buildReportSignals(scopedRecords, scopedPredictions, topicFilter === activeLessonId ? lastLessonResult : null);
    const recommendations = buildReportRecommendations({
        topicRows,
        completedLevels,
        totalLevels,
        predictionTotal,
        predictionRate,
        debugRuns,
        debugPassed,
        signals
    });
    const nextFocus = topicRows.find(topic => topic.nextMission) || null;
    const exportedAt = new Date();

    return {
        exportedAt,
        exportedAtLabel: formatReportDate(exportedAt),
        fileDate: exportedAt.toISOString().slice(0, 10),
        summary: {
            completedLevels,
            totalLevels,
            overallPercent,
            verifiedTasks: completed.size,
            runCount,
            passedRuns,
            runSuccessRate,
            predictionTotal,
            predictionCorrect,
            predictionRate,
            debugTotal: debugRuns.length,
            debugPassed,
            trainedSkills,
            nextFocusLabel: nextFocus?.nextLevel || "All available levels complete",
            nextFocusTopic: nextFocus?.title || ""
        },
        topics: topicRows,
        skills,
        recentExercises,
        signals,
        recommendations,
        scope: {
            ...scope,
            isTopicReport: Boolean(topicFilter)
        }
    };
}

function buildTopicReportRow(topicId, completed = getCompletedMissions()) {
    const progress = getTopicProgress(topicId);
    const title = LESSONS[topicId]?.title || topicId;
    const levels = progress.path.map((mission, index) => {
        const task = getTaskForReport(mission.topicId, mission.taskId);
        const isCompleted = isMissionCompleted(mission, completed);
        const isNext = progress.nextMission?.taskId === mission.taskId;
        const locked = !isCompleted && !isNext && !isMissionLevelAccessible(index, completed, progress.path);
        return {
            level: mission.level,
            stage: mission.stage,
            taskTitle: task?.title || "Practice task",
            status: isCompleted ? "Completed" : isNext ? "Next" : locked ? "Locked" : "Ready",
            statusKey: isCompleted ? "done" : isNext ? "next" : locked ? "locked" : "ready"
        };
    });

    return {
        topicId,
        title,
        path: progress.path,
        completedCount: progress.completedCount,
        totalCount: progress.totalCount,
        percent: progress.percent,
        nextMission: progress.nextMission,
        nextLevel: progress.nextMission
            ? `Level ${progress.nextMission.level}: ${progress.nextMission.stage}`
            : "Complete",
        levels
    };
}

function getTaskForReport(topicId, taskId) {
    return getQuestionBankForTopic(topicId).find(task => task.id === taskId)
        || getTasksForTopic(topicId).find(task => task.id === taskId)
        || null;
}

function buildRecentExerciseRow(item) {
    const level = getPracticePath(item.topicId).find(mission => mission.taskId === item.taskId);
    const failed = (item.criteria || []).filter(check => !check.passed);
    return {
        time: formatReportDate(item.timestamp),
        topicTitle: item.topicTitle || LESSONS[item.topicId]?.title || item.topicId,
        taskTitle: item.taskTitle || "Practice task",
        levelLabel: level ? `Level ${level.level}` : "Practice",
        result: item.goalPassed ? "Passed" : "Needs work",
        traceSteps: item.traceSteps,
        evidence: failed.length
            ? failed.slice(0, 2).map(check => check.label).join(" ")
            : "Goal met with trace evidence."
    };
}

function buildReportSignals(records, predictions, currentResult) {
    const failedChecks = records.flatMap(record =>
        (record.criteria || [])
            .filter(check => !check.passed)
            .map(check => ({ check, record }))
    );
    if (currentResult?.criteria?.length) {
        currentResult.criteria
            .filter(check => !check.passed)
            .forEach(check => failedChecks.push({ check, record: { topicTitle: LESSONS[activeLessonId]?.title || "" } }));
    }

    const signals = [];
    const wrongPredictions = predictions.filter(item => !item.correct);
    const shortcutCount = failedChecks.filter(item => item.check.type === "antiShortcut" || /shortcut/i.test(item.check.label || "")).length;
    const runtimeCount = failedChecks.filter(item => item.check.type === "noErrors").length;
    const valueCount = failedChecks.filter(item => item.check.type === "variableEquals").length;
    const conceptCounts = failedChecks
        .filter(item => item.check.type === "conceptSeen")
        .reduce((map, item) => {
            const concept = item.check.concept || "process evidence";
            map.set(concept, (map.get(concept) || 0) + 1);
            return map;
        }, new Map());

    if (wrongPredictions.length) {
        const variables = [...new Set(wrongPredictions.map(item => item.variable).filter(Boolean))].slice(0, 3).join(", ");
        signals.push({
            label: "Prediction accuracy",
            level: "Review",
            detail: `${wrongPredictions.length} prediction attempt${wrongPredictions.length === 1 ? "" : "s"} were incorrect${variables ? `, often around ${variables}` : ""}.`
        });
    }

    if (runtimeCount) {
        signals.push({
            label: "Executable code",
            level: "Fix first",
            detail: `${runtimeCount} run${runtimeCount === 1 ? "" : "s"} still stopped with an error before the goal could be trusted.`
        });
    }

    if (valueCount) {
        signals.push({
            label: "Final state",
            level: "Review",
            detail: `${valueCount} check${valueCount === 1 ? "" : "s"} had a wrong or missing target variable value.`
        });
    }

    if (shortcutCount) {
        signals.push({
            label: "Process evidence",
            level: "Review",
            detail: `${shortcutCount} attempt${shortcutCount === 1 ? "" : "s"} looked like a direct final-answer shortcut instead of a repaired process.`
        });
    }

    [...conceptCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .forEach(([concept, count]) => {
            signals.push({
                label: `${concept} evidence`,
                level: "Practice",
                detail: `${count} check${count === 1 ? "" : "s"} still needed clearer ${concept} behavior in the trace.`
            });
        });

    if (!signals.length) {
        return [{
            label: "No major gap yet",
            level: "Stable",
            detail: "The current session has not produced a strong misunderstanding signal. More attempts will make this section more useful."
        }];
    }

    return signals.slice(0, 6);
}

function buildReportRecommendations(context) {
    const recommendations = [];
    const nextTopic = context.topicRows.find(topic => topic.nextMission);
    const hasAccumulatorGap = context.signals.some(item => /Accumulator/i.test(item.label + item.detail));
    const hasRuntimeGap = context.signals.some(item => /Executable code/i.test(item.label));
    const hasShortcutGap = context.signals.some(item => /shortcut|Process evidence/i.test(item.detail + item.label));

    if (context.completedLevels === 0) {
        recommendations.push("Start with the current topic's Level 1 and keep the first success small: fill the blank, run the trace, then read the final variable.");
    }

    if (hasRuntimeGap) {
        recommendations.push("Fix runtime or syntax errors before discussing algorithm quality. A report should first show that the program can finish.");
    }

    if (context.predictionTotal >= 3 && context.predictionRate < 70) {
        recommendations.push("Use the timeline as a prediction exercise: pause before each variable change and ask what the next value should be.");
    }

    if (hasAccumulatorGap) {
        recommendations.push("Review the accumulator pattern: keep the old value, add the current item, and confirm the running total in the trace.");
    }

    if (hasShortcutGap) {
        recommendations.push("Ask for trace evidence, not only the final answer. The student should explain which line creates the target value.");
    }

    if (context.debugRuns.length && context.debugPassed < context.debugRuns.length) {
        recommendations.push("For Debug Detective, have the student identify the suspicious line before editing. The explanation should mention the bad state change.");
    }

    if (nextTopic) {
        recommendations.push(`Next practice focus: ${nextTopic.title}, ${nextTopic.nextLevel}.`);
    }

    if (!recommendations.length) {
        recommendations.push("Continue to the next unlocked level and keep using trace evidence to explain each successful run.");
    }

    return recommendations.slice(0, 5);
}

function renderLearningReportHtml(report, options = {}) {
    const autoPrint = Boolean(options.autoPrint);
    const title = report.scope?.isTopicReport
        ? `${report.scope.label} Practice Report`
        : "Python Trace Practice Report";
    const topicSectionTitle = report.scope?.isTopicReport ? "Level Evidence" : "Topic Progress";
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; background: #f4f6f5; color: #1e2924; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
        .report { width: min(980px, calc(100% - 32px)); margin: 24px auto; background: #ffffff; border: 1px solid #dbe5df; border-radius: 8px; overflow: hidden; box-shadow: 0 18px 48px rgba(21, 31, 26, 0.1); }
        .hero { padding: 28px 32px; background: #18231f; color: #ffffff; display: grid; gap: 8px; }
        .hero h1 { margin: 0; font-size: 28px; letter-spacing: 0; }
        .hero p { margin: 0; color: #c9d8d0; font-size: 14px; }
        .section { padding: 22px 32px; border-bottom: 1px solid #e4ebe7; }
        .section:last-child { border-bottom: 0; }
        .section h2 { margin: 0 0 12px; font-size: 16px; color: #18231f; }
        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .stat { border: 1px solid #dbe5df; border-radius: 8px; padding: 12px; background: #fbfcfb; }
        .stat strong { display: block; font-size: 22px; color: #0f5132; }
        .stat span { color: #60736a; font-size: 12px; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; color: #60736a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #dbe5df; padding: 8px 7px; }
        td { border-bottom: 1px solid #edf2ef; padding: 8px 7px; vertical-align: top; }
        tr:last-child td { border-bottom: 0; }
        .bar { height: 8px; background: #e7eeea; border-radius: 999px; overflow: hidden; margin-top: 5px; }
        .fill { height: 100%; background: linear-gradient(90deg, #2f855a, #2b6cb0); border-radius: inherit; }
        .level-pills, .skill-list, .signal-list, .rec-list { display: flex; flex-wrap: wrap; gap: 7px; }
        .pill { display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 28px; border-radius: 999px; border: 1px solid #cfd9d4; color: #60736a; font-weight: 800; font-size: 11px; }
        .pill.done { background: #def7e8; border-color: #63b37d; color: #14532d; }
        .pill.next { background: #e0f2fe; border-color: #60a5fa; color: #1e3a8a; }
        .pill.ready { background: #fff7df; border-color: #e5b84a; color: #7a5410; }
        .skill { display: grid; gap: 5px; min-width: 150px; flex: 1 1 160px; border: 1px solid #dbe5df; border-radius: 8px; padding: 9px; }
        .skill-head { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; font-weight: 700; }
        .signal, .recommendation { flex: 1 1 220px; border: 1px solid #dbe5df; border-radius: 8px; padding: 10px; background: #fbfcfb; }
        .signal strong, .recommendation strong { display: block; margin-bottom: 4px; color: #18231f; }
        .signal span { display: inline-block; margin-bottom: 5px; color: #2b6cb0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; }
        .muted { color: #60736a; }
        .result-pass { color: #0f6b3e; font-weight: 800; }
        .result-fix { color: #9a5b00; font-weight: 800; }
        .print-note { margin-top: 14px; color: #60736a; font-size: 12px; }
        @media (max-width: 760px) {
            .report { width: 100%; margin: 0; border-radius: 0; }
            .stat-grid, .two-col { grid-template-columns: 1fr; }
            .hero, .section { padding: 20px; }
        }
        @media print {
            @page { margin: 14mm; }
            body { background: #ffffff; }
            .report { width: 100%; margin: 0; border: 0; box-shadow: none; border-radius: 0; }
            .hero { background: #ffffff; color: #111827; border-bottom: 2px solid #111827; padding: 0 0 14px; }
            .hero p { color: #4b5563; }
            .section { padding: 14px 0; break-inside: avoid; }
            .stat, .skill, .signal, .recommendation { break-inside: avoid; }
            .print-note { display: none; }
        }
    </style>
</head>
<body>
    <main class="report">
        <section class="hero">
            <h1>${title}</h1>
            <p>Generated ${escapeHtml(report.exportedAtLabel)}. ${report.scope?.isTopicReport ? "Focused on one practice topic and its current level batch." : "Covers all practice topics and current training batches."}</p>
        </section>
        <section class="section">
            <h2>Learning Snapshot</h2>
            ${renderReportStats(report)}
            <div class="print-note">Use the browser print dialog and choose "Save as PDF" for a clean PDF copy.</div>
        </section>
        <section class="section">
            <h2>${topicSectionTitle}</h2>
            ${renderReportTopicTable(report.topics)}
        </section>
        <section class="section">
            <h2>Skill Map</h2>
            ${renderReportSkillMap(report.skills)}
        </section>
        <section class="section two-col">
            <div>
                <h2>Misunderstanding Signals</h2>
                ${renderReportSignals(report.signals)}
            </div>
            <div>
                <h2>Next Review Plan</h2>
                ${renderReportRecommendations(report.recommendations)}
            </div>
        </section>
        <section class="section">
            <h2>Recent Practice Evidence</h2>
            ${renderReportExerciseTable(report.recentExercises)}
        </section>
    </main>
    ${autoPrint ? `<script>window.addEventListener("load", () => setTimeout(() => window.print(), 300));<\/script>` : ""}
</body>
</html>`;
}

function renderReportStats(report) {
    const summary = report.summary;
    const predictionText = summary.predictionTotal ? `${summary.predictionCorrect}/${summary.predictionTotal}` : "No data";
    const debugText = summary.debugTotal ? `${summary.debugPassed}/${summary.debugTotal}` : "No data";
    const nextText = summary.nextFocusTopic
        ? `${summary.nextFocusTopic}: ${summary.nextFocusLabel}`
        : summary.nextFocusLabel;
    const stats = [
        [`${summary.completedLevels}/${summary.totalLevels}`, "Levels completed"],
        [`${summary.overallPercent}%`, "Overall progress"],
        [`${summary.passedRuns}/${summary.runCount || 0}`, "Compile runs passed"],
        [predictionText, "Predictions correct"],
        [debugText, "Debug levels passed"],
        [summary.trainedSkills, "Skills touched"]
    ];

    return `
        <div class="stat-grid">
            ${stats.map(([value, label]) => `<div class="stat"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("")}
        </div>
        <p class="muted" style="margin: 12px 0 0;"><strong>Suggested next focus:</strong> ${escapeHtml(nextText)}</p>
    `;
}

function renderReportTopicTable(topics) {
    const rows = topics.map(topic => `
        <tr>
            <td><strong>${escapeHtml(topic.title)}</strong></td>
            <td>
                ${topic.completedCount}/${topic.totalCount} levels
                <div class="bar"><div class="fill" style="width: ${topic.percent}%"></div></div>
            </td>
            <td>
                <div class="level-pills">
                    ${topic.levels.map(level => `<span class="pill ${level.statusKey}" title="${escapeHtml(level.taskTitle)}">${level.level}</span>`).join("")}
                </div>
            </td>
            <td>${escapeHtml(topic.nextLevel)}</td>
        </tr>
    `).join("");

    return `
        <table>
            <thead><tr><th>Topic</th><th>Progress</th><th>Levels</th><th>Next</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function renderReportSkillMap(skills) {
    const rows = skills
        .slice()
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
        .map(skill => `
            <div class="skill">
                <div class="skill-head"><span>${escapeHtml(skill.label)}</span><span>${skill.value}%</span></div>
                <div class="bar"><div class="fill" style="width: ${skill.value}%"></div></div>
            </div>
        `).join("");

    return `<div class="skill-list">${rows}</div>`;
}

function renderReportSignals(signals) {
    return `
        <div class="signal-list">
            ${signals.map(item => `
                <div class="signal">
                    <span>${escapeHtml(item.level)}</span>
                    <strong>${escapeHtml(item.label)}</strong>
                    <p class="muted" style="margin:0;">${escapeHtml(item.detail)}</p>
                </div>
            `).join("")}
        </div>
    `;
}

function renderReportRecommendations(recommendations) {
    return `
        <div class="rec-list">
            ${recommendations.map((item, index) => `
                <div class="recommendation">
                    <strong>Step ${index + 1}</strong>
                    <p class="muted" style="margin:0;">${escapeHtml(item)}</p>
                </div>
            `).join("")}
        </div>
    `;
}

function renderReportExerciseTable(rows) {
    if (!rows.length) {
        return `<p class="muted">No compile evidence has been recorded in this browser session yet.</p>`;
    }

    return `
        <table>
            <thead><tr><th>Time</th><th>Task</th><th>Result</th><th>Evidence</th></tr></thead>
            <tbody>
                ${rows.map(row => `
                    <tr>
                        <td>${escapeHtml(row.time)}</td>
                        <td><strong>${escapeHtml(row.topicTitle)}</strong><br><span class="muted">${escapeHtml(row.levelLabel)}: ${escapeHtml(row.taskTitle)}</span></td>
                        <td class="${row.result === "Passed" ? "result-pass" : "result-fix"}">${escapeHtml(row.result)}</td>
                        <td>${escapeHtml(row.evidence)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function openReportHtml(html) {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return false;
    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
    reportWindow.focus();
    return true;
}

function downloadHtml(filename, html) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function formatReportDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function togglePresentationMode() {
    setPresentationMode(!presentationMode);
}

function setPresentationMode(enabled) {
    presentationMode = enabled;
    document.body.classList.toggle("presentation-mode", presentationMode);
    btnPresentationMode.textContent = presentationMode ? "Exit Focus" : "Focus Mode";
}

function maybeStartGuide() {
    if (localStorage.getItem(GUIDE_KEY) === "true") return;
    startGuide(false);
}

function startGuide(force = false) {
    if (force) {
        localStorage.removeItem(GUIDE_KEY);
    }

    if (!force && localStorage.getItem(GUIDE_KEY) === "true") return;
    guideIndex = 0;
    guideOverlay.classList.add("visible");
    renderGuideStep();
}

function renderGuideStep() {
    const step = GUIDE_STEPS[guideIndex];
    document.querySelectorAll(".guide-focus").forEach(element => element.classList.remove("guide-focus"));

    guideTitle.textContent = step.title;
    guideBody.textContent = step.body;
    guideStep.textContent = `${guideIndex + 1} / ${GUIDE_STEPS.length}`;
    btnGuidePrev.disabled = guideIndex === 0;
    btnGuideNext.textContent = guideIndex === GUIDE_STEPS.length - 1 ? "Finish" : "Next";

    const focusTarget = document.querySelector(step.focus);
    if (focusTarget) {
        focusTarget.classList.add("guide-focus");
        focusTarget.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    }

    window.setTimeout(positionGuideCard, 260);
}

function advanceGuide() {
    if (guideIndex >= GUIDE_STEPS.length - 1) {
        completeGuide();
        return;
    }

    guideIndex++;
    renderGuideStep();
}

function previousGuide() {
    if (guideIndex === 0) return;
    guideIndex--;
    renderGuideStep();
}

function positionGuideCard() {
    if (!guideOverlay.classList.contains("visible")) return;

    const step = GUIDE_STEPS[guideIndex];
    const focusTarget = document.querySelector(step.focus);
    const cardRect = guideCard.getBoundingClientRect();
    const margin = 16;

    if (!focusTarget) {
        guideCard.style.left = `${Math.max(margin, (window.innerWidth - cardRect.width) / 2)}px`;
        guideCard.style.top = `${Math.max(margin, (window.innerHeight - cardRect.height) / 2)}px`;
        return;
    }

    const targetRect = focusTarget.getBoundingClientRect();
    const preferred = step.placement || "right";
    const placements = [preferred, "right", "left", "bottom", "top"]
        .filter((placement, index, list) => list.indexOf(placement) === index);

    const candidates = placements.map(placement => {
        let left = targetRect.right + margin;
        let top = targetRect.top + (targetRect.height - cardRect.height) / 2;

        if (placement === "left") {
            left = targetRect.left - cardRect.width - margin;
        } else if (placement === "top") {
            left = targetRect.left + (targetRect.width - cardRect.width) / 2;
            top = targetRect.top - cardRect.height - margin;
        } else if (placement === "bottom") {
            left = targetRect.left + (targetRect.width - cardRect.width) / 2;
            top = targetRect.bottom + margin;
        }

        left = clamp(left, margin, window.innerWidth - cardRect.width - margin);
        top = clamp(top, margin, window.innerHeight - cardRect.height - margin);

        const candidateRect = {
            left,
            top,
            right: left + cardRect.width,
            bottom: top + cardRect.height
        };
        const overlapPenalty = rectsOverlap(candidateRect, targetRect, 10) ? -100000 : 0;
        const distance = distanceBetweenRects(candidateRect, targetRect);
        const preferredBonus = placement === preferred ? 1000 : 0;

        return { left, top, score: overlapPenalty + distance + preferredBonus };
    });

    const best = candidates.sort((a, b) => b.score - a.score)[0];
    guideCard.style.left = `${best.left}px`;
    guideCard.style.top = `${best.top}px`;
}

function clamp(value, min, max) {
    if (max < min) return min;
    return Math.min(Math.max(value, min), max);
}

function rectsOverlap(a, b, padding = 0) {
    return !(
        a.right + padding <= b.left ||
        a.left - padding >= b.right ||
        a.bottom + padding <= b.top ||
        a.top - padding >= b.bottom
    );
}

function distanceBetweenRects(a, b) {
    const ax = (a.left + a.right) / 2;
    const ay = (a.top + a.bottom) / 2;
    const bx = (b.left + b.right) / 2;
    const by = (b.top + b.bottom) / 2;
    return Math.hypot(ax - bx, ay - by);
}

function completeGuide() {
    localStorage.setItem(GUIDE_KEY, "true");
    guideOverlay.classList.remove("visible");
    document.querySelectorAll(".guide-focus").forEach(element => element.classList.remove("guide-focus"));
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
}

populateModeSelect();
populateLessonSelect();
populateReportScopeSelect();
setActiveLesson(activeLessonId, false);
syncEditorRendering();
renderConceptTags([]);
resetPredictionPanel();
renderLessonStatus(null);
renderTeacherInsights();
renderDashboard();
renderQuestionBank();
renderInitialConsole();
updateRunAvailability();
maybePromptCompletedTopic(activeLessonId);
maybeStartGuide();
