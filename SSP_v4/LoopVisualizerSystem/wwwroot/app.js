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
let finalValueAttemptCounts = {};
let finalValueCompleted = new Set();
let finalValueRevealedAnswers = {};
let studentActionLog = [];
let exerciseTrainingRecords = [];
let presentationMode = false;

const GUIDE_KEY = "ssp_first_run_guide_completed";
const BRIGHT_PALETTE = ["#ff7b72", "#3fb950", "#d29922", "#a5d6ff", "#f274c5", "#58a6ff", "#ffc600", "#e2a6ff"];

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

const btnRun = document.getElementById('btn-run');
const btnOpenGuide = document.getElementById('btn-open-guide');
const slider = document.getElementById('trace-slider');
const consoleOutput = document.getElementById('console-output');
const scopeGrid = document.getElementById('scope-grid');
const stepCounter = document.getElementById('step-counter');
const conceptPanel = document.getElementById('concept-panel');
const exampleSelect = document.getElementById('example-select');
const lessonSelect = document.getElementById('lesson-select');
const btnCheckLesson = document.getElementById('btn-check-lesson');
const lessonGoal = document.getElementById('lesson-goal');
const lessonStatus = document.getElementById('lesson-status');
const teacherInsights = document.getElementById('teacher-insights');
const btnExportReport = document.getElementById('btn-export-report');
const btnPresentationMode = document.getElementById('btn-presentation-mode');
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
const topicBrief = document.getElementById('topic-brief');
const algorithmIntro = document.getElementById('algorithm-intro');

const GUIDE_STEPS = [
    {
        title: "1. Choose a topic",
        body: "Start with the programming idea for this practice session.",
        focus: "#lesson-select",
        placement: "bottom"
    },
    {
        title: "2. Choose a practice task",
        body: "Pick the exercise inside the selected topic.",
        focus: "#example-select",
        placement: "bottom"
    },
    {
        title: "3. Read the knowledge point",
        body: "This panel gives the short concept summary for the selected topic.",
        focus: "#knowledge-panel",
        placement: "bottom"
    },
    {
        title: "4. Read the algorithm idea",
        body: "This panel describes the programming pattern students should apply.",
        focus: "#algorithm-panel",
        placement: "bottom"
    },
    {
        title: "5. Run the code",
        body: "Use Compile & Run from the code panel when the code is ready.",
        focus: "#btn-run",
        placement: "bottom"
    },
    {
        title: "6. Check the learning goal",
        body: "The exercise panel shows the student learning goal for this task.",
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
        title: "8. Read variables and explanation",
        body: "The bottom display shows variable values and the explanation for the selected step.",
        focus: "#timeline-panel",
        placement: "top"
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

function getTasksForTopic(topicId) {
    return PRACTICE_TASKS[topicId] || [];
}

function getActiveTask() {
    const tasks = getTasksForTopic(activeLessonId);
    return tasks.find(task => task.id === activeTaskId) || tasks[0] || null;
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
    return true;
}

function getMaskedValue(value, hidden = false) {
    return hidden ? "hidden until checked" : value;
}

function syncEditorRendering(highlightLineNum = -1) {
    const lines = codeInput.value.split('\n');

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

        if (isTimelineActive && Object.keys(variableColorMap).length > 0) {
            let renderedLine = escapeHtml(lineText);
            for (const [varName, color] of Object.entries(variableColorMap)) {
                const regex = new RegExp(`\\b${escapeRegExp(varName)}\\b`, 'g');
                renderedLine = renderedLine.replace(regex, `<span style="color: ${color}; font-weight: bold;">${escapeHtml(varName)}</span>`);
            }
            row.innerHTML = renderedLine === '' ? ' ' : renderedLine;
        } else {
            row.textContent = lineText === '' ? ' ' : lineText;
        }

        codeViewer.appendChild(row);
    });
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
    lessonSelect.innerHTML = Object.entries(LESSONS)
        .map(([id, lesson]) => `<option value="${id}">${escapeHtml(lesson.title)}</option>`)
        .join('');
    lessonSelect.value = activeLessonId;
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

function setActiveLesson(id, shouldLog = true) {
    activeContentMode = "practice-task";
    activeLessonId = id;
    lessonSelect.value = id;
    activeTaskId = getTasksForTopic(id)[0]?.id || "";
    populateTaskSelect(id);
    setActiveTask(activeTaskId, false);

    if (shouldLog) {
        logStudentAction("select", "Topic", {
            selectedTopicId: id,
            selectedTopicTitle: LESSONS[id].title
        });
    }
}

function resetFinalValueQuizState() {
    finalValueAttemptCounts = {};
    finalValueCompleted = new Set();
    finalValueRevealedAnswers = {};
}

function setActiveTask(taskId, shouldLog = true) {
    const task = getTasksForTopic(activeLessonId).find(item => item.id === taskId);
    if (!task) return;

    activeContentMode = "practice-task";
    activeTaskId = taskId;
    exampleSelect.value = taskId;
    codeInput.value = task.starterCode;
    resetFinalValueQuizState();
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
    const topic = LESSONS[activeLessonId];
    const task = getActiveTask();
    if (!task) return;

    renderTopicInfo();
    lessonGoal.innerHTML = `
        <div class="task-kicker">Student Learning Goal</div>
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-objective">${escapeHtml(task.objective)}</div>
        <div class="task-meta">
            <span class="task-pill">${escapeHtml(topic.title)}</span>
            <span class="task-pill">${escapeHtml(topic.concept)}</span>
        </div>
        ${renderBlankRequirements(task)}
        ${renderFinalValueQuiz(task)}
    `;
}

function getMissingBlanks(task = getActiveTask()) {
    if (!task?.blanks?.length) return [];
    return task.blanks.filter(blank => codeInput.value.includes(blank.token));
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
        return `<div class="blank-row ${isFilled ? "filled" : "missing"}">
            <span>${escapeHtml(blank.token)}</span>
            <span>${escapeHtml(blank.label)}</span>
            <strong>${isFilled ? "filled" : "required"}</strong>
        </div>`;
    }).join("");

    return `
        <div class="blank-panel" id="blank-panel">
            <div class="blank-title">Fill-in-the-blank gate</div>
            <div class="blank-help">Replace every blank token in the code editor before compiling.</div>
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

function getFinalValueQuestions(task) {
    return (task?.checks || [])
        .filter(check => check.type === "variableEquals")
        .map(check => ({
            variable: check.variable,
            goalValue: String(check.expected)
        }));
}

function getFinalQuestionKey(question, index) {
    return `${activeLessonId}:${activeTaskId}:${index}:${question.variable}`;
}

function renderFinalValueQuiz(task) {
    const questions = getFinalValueQuestions(task);
    if (!questions.length) return "";

    const questionRows = questions.map((question, index) => {
        const key = getFinalQuestionKey(question, index);
        const attempts = finalValueAttemptCounts[key] || 0;
        const completed = finalValueCompleted.has(key);
        const revealedAnswer = finalValueRevealedAnswers[key] || "";
        const feedback = completed
            ? `<div class="final-question-feedback revealed">Correct answer: <strong>${escapeHtml(revealedAnswer)}</strong></div>`
            : `<div class="final-question-feedback">${pipelineSteps.length ? "Attempts" : "Run the code before checking. Attempts"}: ${attempts}/3</div>`;

        return `
            <div class="final-question" data-final-question-index="${index}">
                <div class="final-question-prompt">Final value of <strong>${escapeHtml(question.variable)}</strong>?</div>
                <input class="final-answer-input" type="text" autocomplete="off" ${completed ? "disabled" : ""}>
                <button class="secondary-btn final-check-button" type="button" ${completed ? "disabled" : ""}>Check</button>
                ${feedback}
            </div>
        `;
    }).join("");

    return `
        <div class="final-check-panel" id="final-value-quiz">
            <div class="final-check-title">Final Value Questions</div>
            ${questionRows}
        </div>
    `;
}

function normalizeFinalAnswer(value) {
    const trimmed = normalizeValue(value);
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1).trim();
    }
    return trimmed;
}

function resolveFinalQuestionAnswer(question) {
    if (!pipelineSteps.length) return null;

    const finalVars = getFinalVariables(pipelineSteps);
    if (Object.prototype.hasOwnProperty.call(finalVars, question.variable)) {
        return String(finalVars[question.variable]);
    }

    return "not allocated";
}

function checkFinalValueQuestion(questionIndex, row) {
    const task = getActiveTask();
    const question = getFinalValueQuestions(task)[questionIndex];
    if (!question) return;

    const input = row.querySelector(".final-answer-input");
    const button = row.querySelector(".final-check-button");
    const feedback = row.querySelector(".final-question-feedback");
    const guess = input?.value ?? "";

    const expectedAnswer = resolveFinalQuestionAnswer(question);
    if (expectedAnswer === null) {
        feedback.textContent = "Click Compile & Run first to generate the current trace.";
        feedback.className = "final-question-feedback needs-work";
        return;
    }

    if (!normalizeFinalAnswer(guess)) {
        feedback.textContent = "Enter an answer before checking.";
        feedback.className = "final-question-feedback needs-work";
        return;
    }

    const key = getFinalQuestionKey(question, questionIndex);
    const attemptNumber = (finalValueAttemptCounts[key] || 0) + 1;
    finalValueAttemptCounts[key] = attemptNumber;

    const isCorrect = normalizeFinalAnswer(guess) === normalizeFinalAnswer(expectedAnswer);
    const shouldReveal = isCorrect || attemptNumber >= 3;

    logStudentAction("button", "Final Value Check", {
        variable: question.variable,
        guess,
        expected: expectedAnswer,
        goalValue: question.goalValue,
        attemptNumber,
        result: isCorrect ? "correct" : "wrong",
        answerShown: shouldReveal
    });

    if (shouldReveal) {
        finalValueCompleted.add(key);
        finalValueRevealedAnswers[key] = expectedAnswer;
        input.disabled = true;
        button.disabled = true;
        feedback.innerHTML = isCorrect
            ? `Correct. The correct answer is <strong>${escapeHtml(expectedAnswer)}</strong>.`
            : `After attempt ${attemptNumber}, the correct answer is <strong>${escapeHtml(expectedAnswer)}</strong>.`;
        feedback.className = isCorrect ? "final-question-feedback good" : "final-question-feedback revealed";
        return;
    }

    const remainingAttempts = Math.max(0, 3 - attemptNumber);
    feedback.textContent = `Not quite. You can try ${remainingAttempts} more time${remainingAttempts === 1 ? "" : "s"}.`;
    feedback.className = "final-question-feedback needs-work";
}

function renderTopicInfo() {
    const details = TOPIC_DETAILS[activeLessonId] || {};
    const topic = LESSONS[activeLessonId] || {};

    if (topicBrief) {
        topicBrief.innerHTML = `<strong>${escapeHtml(topic.title || "Topic")}</strong><br>${escapeHtml(details.brief || "No topic summary available.")}`;
    }

    if (algorithmIntro) {
        algorithmIntro.textContent = details.algorithm || "No algorithm summary available.";
    }
}

codeInput.addEventListener('input', () => {
    resetFinalValueQuizState();
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

lessonSelect.addEventListener('change', () => {
    setActiveLesson(lessonSelect.value, true);
});

lessonGoal.addEventListener('click', (event) => {
    const button = event.target.closest(".final-check-button");
    if (!button) return;

    const row = button.closest(".final-question");
    if (!row) return;

    checkFinalValueQuestion(Number(row.dataset.finalQuestionIndex), row);
});

lessonGoal.addEventListener('keydown', (event) => {
    if (event.key !== "Enter" || !event.target.classList.contains("final-answer-input")) return;

    const row = event.target.closest(".final-question");
    if (!row) return;

    checkFinalValueQuestion(Number(row.dataset.finalQuestionIndex), row);
});

btnCheckLesson.addEventListener('click', () => {
    if (!pipelineSteps.length) {
        logStudentAction("button", "Student Learning Goal", { result: "no_trace" });
        renderLessonStatus({
            passed: false,
            criteria: [{ passed: false, label: "Run the program before checking the task." }]
        });
        return;
    }
    lastLessonResult = evaluateLesson(getActiveTask(), pipelineSteps);
    logStudentAction("button", "Student Learning Goal", {
        result: lastLessonResult.passed ? "passed" : "failed",
        criteria: lastLessonResult.criteria
    });
    renderLessonStatus(lastLessonResult);
    renderTeacherInsights();
});

btnExportReport.addEventListener('click', exportTeacherReport);
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

btnRun.addEventListener('click', async () => {
    if (!canCompileActiveTask()) {
        renderLessonGoal();
        updateRunAvailability();
        consoleOutput.innerHTML = `<span style="color: #f4c95d;">Fill every blank token before compiling this task.</span>`;
        return;
    }

    const code = codeInput.value;
    logStudentAction("button", "Compile & Run", {
        codeLength: code.length
    });
    btnRun.textContent = "Running...";
    btnRun.disabled = true;

    try {
        const response = await fetch('/api/execution/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        });

        if (!response.ok) throw new Error("Backend infrastructure execution alert.");

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
        lastLessonResult = evaluateLesson(task, pipelineSteps);
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
            criteria: lastLessonResult.criteria
        });
        renderTeacherInsights();
    } catch (err) {
        isTimelineActive = false;
        variableColorMap = {};
        syncEditorRendering();
        renderConceptTags([]);
        resetPredictionPanel();
        renderLessonStatus(null);
        consoleOutput.innerHTML = `<span style="color: #f85149;">Compilation Core Error: ${escapeHtml(err.message)}</span>`;
    } finally {
        updateRunAvailability();
    }
});

slider.addEventListener('input', (event) => {
    renderFrame(parseInt(event.target.value));
});

btnCheckPrediction.addEventListener('click', checkPrediction);
btnRevealAnswer.addEventListener('click', revealAnswer);
btnOpenGuide.addEventListener('click', () => startGuide(true));
btnGuideNext.addEventListener('click', advanceGuide);
btnGuidePrev.addEventListener('click', previousGuide);
btnGuideSkip.addEventListener('click', completeGuide);
window.addEventListener('resize', positionGuideCard);
window.addEventListener('scroll', positionGuideCard, true);
window.addEventListener('keydown', (event) => {
    if (event.key === "Escape" && presentationMode) {
        setPresentationMode(false);
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
    const changeSummary = (frame.changes || []).length
        ? frame.changes.map(change => {
            const beforeValue = change.changeType === "initialized" ? "not allocated" : change.before;
            const afterValue = change.changeType === "removed" ? "removed" : change.after;
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

    const explanation = formatExplanation(frame, target, true);
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

    if (Object.keys(vars).length === 0) {
        scopeGrid.innerHTML = `<div style="color: #91a39a; font-size: 12px; font-style: italic;">Run the code to see variable values.</div>`;
        return;
    }

    for (const [key, value] of Object.entries(vars)) {
        const varColor = variableColorMap[key] || "#c9d1d9";
        const displayValue = value;
        const card = document.createElement('div');
        card.className = 'variable-card';
        card.style.border = `1px solid ${varColor}`;
        card.style.background = `rgba(${hexToRgb(varColor)}, 0.04)`;
        card.innerHTML = `<span class="name" style="color: ${varColor}">${escapeHtml(key)}</span> = <span class="value" style="color: #ffffff; font-weight: bold; background: rgba(${hexToRgb(varColor)}, 0.2); padding: 1px 6px; border-radius: 4px;">${escapeHtml(displayValue)}</span>`;
        scopeGrid.appendChild(card);
    }
}

function renderPredictionPanel(frame) {
    const target = getPredictionTarget(frame);

    predictionTarget = target || null;
    predictionInput.value = "";
    predictionFeedback.textContent = "";
    predictionFeedback.className = "prediction-feedback";
    btnCheckPrediction.disabled = false;
    btnRevealAnswer.disabled = !target;

    if (!target) {
        predictionPrompt.textContent = "No variable changes on this step.";
        return;
    }

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
    renderConsole(frame);
    renderScopeGrid(frame.afterVariables || frame.variables || {}, frame);
}

function resetPredictionPanel() {
    predictionTarget = null;
    predictionPrompt.textContent = "Run code to make a prediction.";
    predictionInput.value = "";
    predictionInput.disabled = false;
    predictionFeedback.textContent = "";
    predictionFeedback.className = "prediction-feedback";
    btnCheckPrediction.disabled = false;
    btnRevealAnswer.disabled = true;
}

function evaluateLesson(lesson, steps) {
    const finalVars = getFinalVariables(steps);
    const stdout = getFinalStdout(steps);
    const concepts = getConceptCoverage(steps);
    const hasError = steps.some(step => step.error);

    const criteria = lesson.checks.map(check => {
        if (check.type === "noErrors") {
            return { passed: !hasError, label: hasError ? "Program must finish without errors." : "Program finished without errors." };
        }

        if (check.type === "variableEquals") {
            const actual = normalizeValue(finalVars[check.variable]);
            const expected = normalizeValue(check.expected);
            return {
                passed: actual === expected,
                label: `${check.variable} should finish as ${expected}. Actual: ${actual || "not allocated"}.`
            };
        }

        if (check.type === "stdoutContains") {
            const passed = stdout.includes(check.text);
            return { passed, label: `Console output should include ${check.text}.` };
        }

        if (check.type === "conceptSeen") {
            const passed = concepts.has(check.concept);
            return { passed, label: `Trace should include concept: ${check.concept}.` };
        }

        if (check.type === "errorCategory") {
            const passed = steps.some(step => step.errorCategory === check.expected);
            return {
                passed,
                label: passed
                    ? `Trace identified expected error: ${check.expected}.`
                    : `Trace should identify error: ${check.expected}.`
            };
        }

        return { passed: false, label: "Unknown check." };
    });

    return {
        passed: criteria.every(item => item.passed),
        criteria,
        finalVars,
        stdout,
        concepts: [...concepts]
    };
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

function exportTeacherReport() {
    downloadJson("ssp-student-activity-report.json", {
        exportedAt: new Date().toISOString(),
        operationTimeline: studentActionLog.map((item, index) => ({
            order: index + 1,
            time: item.timestamp,
            actionType: item.actionType,
            label: item.label,
            topicTitle: item.topicTitle,
            taskTitle: item.taskTitle,
            contentMode: item.contentMode,
            stepIndex: item.stepIndex,
            result: item.result || "",
            details: item
        })),
        trainedExerciseTable: exerciseTrainingRecords.map((item, index) => ({
            order: index + 1,
            time: item.timestamp,
            topicId: item.topicId,
            topicTitle: item.topicTitle,
            taskId: item.taskId,
            taskTitle: item.taskTitle,
            focusConcept: item.focusConcept,
            traceSteps: item.traceSteps,
            goalPassed: item.goalPassed,
            criteriaSummary: item.criteria.map(check => `${check.passed ? "pass" : "fix"}: ${check.label}`).join(" | ")
        })),
        predictionResultTable: predictionAttempts.map((item, index) => ({
            order: index + 1,
            time: item.timestamp,
            topicTitle: item.topicTitle,
            taskTitle: item.taskTitle,
            contentMode: item.contentMode,
            stepNumber: item.stepNumber,
            line: item.line,
            variable: item.variable,
            guess: item.guess,
            expectedAnswer: item.expected,
            result: item.correct ? "correct" : "wrong",
            attemptNumber: item.attemptNumber,
            answerShownToStudent: item.answerShown,
            concepts: (item.concepts || []).join(", ")
        }))
    });
}

function togglePresentationMode() {
    setPresentationMode(!presentationMode);
}

function setPresentationMode(enabled) {
    presentationMode = enabled;
    document.body.classList.toggle("presentation-mode", presentationMode);
    btnPresentationMode.textContent = presentationMode ? "Exit Presentation" : "Presentation Mode";
}

function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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

populateLessonSelect();
setActiveLesson(activeLessonId, false);
syncEditorRendering();
renderConceptTags([]);
resetPredictionPanel();
renderLessonStatus(null);
renderTeacherInsights();
renderInitialConsole();
updateRunAvailability();
maybeStartGuide();
