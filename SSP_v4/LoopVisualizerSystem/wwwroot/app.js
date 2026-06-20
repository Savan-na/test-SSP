let pipelineSteps = [];
let variableColorMap = {};
let isTimelineActive = false;
let currentFrameIndex = 0;
let predictionTarget = null;
let activeLessonId = "accumulator";
let activeTaskId = "accumulator-s1-l0";
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
let levelZeroAttemptCounts = {};
let revealedLevelZeroAnswers = new Set();
let pendingCompletedTopicId = null;
let activeBankEditorTask = null;
let activeReviewLabTaskId = "review-average-empty";
let reviewLabLoadedTaskId = null;
let reviewLabLastResult = null;
let reviewLabRunning = false;
let reviewLabSessionMessage = "";
let reviewLabDraftTimer = null;

const GUIDE_KEY = "ssp_first_run_guide_completed";
const MISSION_PROGRESS_KEY = "ssp_v11_completed_levels";
const SKILL_PROGRESS_KEY = "ssp_v11_skill_progress";
const TOPIC_BATCH_KEY = "ssp_v11_topic_batches";
const TEACHER_TASK_OVERRIDES_KEY = "ssp_v12_teacher_task_overrides";
const REVIEW_LAB_RECORDS_KEY = "ssp_v1_review_lab_records";
const REVIEW_LAB_PROGRESS_KEY = "ssp_v1_review_lab_progress";
const REVIEW_LAB_DRAFTS_KEY = "ssp_v2_review_lab_drafts";
const REVIEW_LAB_ACTIVE_KEY = "ssp_v2_review_lab_active_task";
const BRIGHT_PALETTE = ["#ff7b72", "#3fb950", "#d29922", "#a5d6ff", "#f274c5", "#58a6ff", "#ffc600", "#e2a6ff"];
const STUDENT_TOPIC_ORDER = ["assignment", "ifElse", "forLoop", "whileLoop", "listTraversal", "accumulator", "nestedLoop", "functionCall", "recursion", "complex"];
const KNOWLEDGE_MAP_POINTS = [
    { topicId: "assignment", x: 120, y: 92 },
    { topicId: "ifElse", x: 310, y: 76 },
    { topicId: "forLoop", x: 310, y: 192 },
    { topicId: "whileLoop", x: 310, y: 308 },
    { topicId: "listTraversal", x: 520, y: 176 },
    { topicId: "accumulator", x: 690, y: 176 },
    { topicId: "nestedLoop", x: 520, y: 318 },
    { topicId: "functionCall", x: 690, y: 72 },
    { topicId: "recursion", x: 855, y: 72 },
    { topicId: "complex", x: 855, y: 260 }
];
const KNOWLEDGE_MAP_LINKS = [
    ["assignment", "ifElse"],
    ["assignment", "forLoop"],
    ["assignment", "functionCall"],
    ["forLoop", "whileLoop"],
    ["forLoop", "listTraversal"],
    ["forLoop", "accumulator"],
    ["listTraversal", "accumulator"],
    ["listTraversal", "nestedLoop"],
    ["functionCall", "recursion"],
    ["ifElse", "complex"],
    ["accumulator", "complex"],
    ["nestedLoop", "complex"],
    ["recursion", "complex"]
];

const REVIEW_LAB_TASKS = [
    {
        id: "review-average-empty",
        title: "Average score with an empty list",
        category: "Correctness and boundaries",
        difficulty: "Starter",
        requirement: "Implement average(scores). It must return the arithmetic mean for a non-empty list and return 0 for an empty list.",
        constraints: ["Use the scores parameter; do not hard-code an answer.", "The same function must handle normal, single-item, and empty lists."],
        aiCode: `def average(scores):
    return sum(scores) / len(scores)`,
        issueOptions: [
            { id: "empty-division", label: "An empty list causes division by zero.", correct: true, feedback: "len([]) is 0, so the division raises ZeroDivisionError before a value can be returned." },
            { id: "normal-result", label: "The formula gives the wrong result for every non-empty list.", correct: false, feedback: "sum(scores) / len(scores) is the correct arithmetic-mean formula when the list is non-empty." },
            { id: "needs-loop", label: "Python requires a manual loop instead of sum().", correct: false, feedback: "sum() is an appropriate built-in here; the defect is the unhandled empty input." }
        ],
        testOptions: [
            { id: "average-normal", label: "average([80, 90]) == 85.0", diagnostic: true },
            { id: "average-empty", label: "average([]) == 0", diagnostic: true },
            { id: "average-single", label: "average([72]) == 72.0", diagnostic: true },
            { id: "average-text", label: "average(['80']) == 80", diagnostic: false }
        ],
        requiredTestIds: ["average-normal", "average-empty"],
        allTests: [
            { id: "average-normal", name: "Normal scores", expression: "average([80, 90])", expectedExpression: "85.0" },
            { id: "average-empty", name: "Empty list boundary", expression: "average([])", expectedExpression: "0" },
            { id: "average-single", name: "Single score", expression: "average([72])", expectedExpression: "72.0" },
            { id: "average-additional", name: "Additional unseen scores", expression: "average([1, 2, 6])", expectedExpression: "3.0" }
        ],
        solution: `def average(scores):
    if not scores:
        return 0
    return sum(scores) / len(scores)`,
        reasonKeywords: ["empty", "zero", "boundary", "len"],
        abilities: ["correctness", "boundaries", "testing", "diagnosis"]
    },
    {
        id: "review-largest-negative",
        title: "Largest value when every number is negative",
        category: "Correctness and data assumptions",
        difficulty: "Developing",
        requirement: "Implement largest(numbers) for a non-empty list of integers. It must return the largest value even when every value is negative.",
        constraints: ["The input is guaranteed to contain at least one integer.", "Do not assume that 0 appears in the input."],
        aiCode: `def largest(numbers):
    result = 0
    for number in numbers:
        if number > result:
            result = number
    return result`,
        issueOptions: [
            { id: "zero-assumption", label: "Starting result at 0 breaks all-negative inputs.", correct: true, feedback: "No negative number is greater than 0, so result incorrectly remains 0 even though 0 is not in the list." },
            { id: "comparison-direction", label: "The comparison must use < instead of >.", correct: false, feedback: "Using > is correct when searching for the largest value." },
            { id: "loop-skips-last", label: "A Python for loop skips the last list item.", correct: false, feedback: "A for loop visits every item in the list unless control flow explicitly stops it." }
        ],
        testOptions: [
            { id: "largest-positive", label: "largest([3, 8, 2]) == 8", diagnostic: true },
            { id: "largest-negative", label: "largest([-9, -2, -7]) == -2", diagnostic: true },
            { id: "largest-single", label: "largest([-4]) == -4", diagnostic: true },
            { id: "largest-empty", label: "largest([]) == 0", diagnostic: false }
        ],
        requiredTestIds: ["largest-positive", "largest-negative"],
        allTests: [
            { id: "largest-positive", name: "Positive values", expression: "largest([3, 8, 2])", expectedExpression: "8" },
            { id: "largest-negative", name: "All-negative boundary", expression: "largest([-9, -2, -7])", expectedExpression: "-2" },
            { id: "largest-single", name: "Single negative value", expression: "largest([-4])", expectedExpression: "-4" },
            { id: "largest-additional", name: "Additional mixed values", expression: "largest([-5, 3, 3, 1])", expectedExpression: "3" }
        ],
        solution: `def largest(numbers):
    result = numbers[0]
    for number in numbers[1:]:
        if number > result:
            result = number
    return result`,
        reasonKeywords: ["negative", "zero", "first", "initial"],
        abilities: ["correctness", "boundaries", "testing", "diagnosis"]
    },
    {
        id: "review-discount-boundary",
        title: "Discount at the exact threshold",
        category: "Boundary logic",
        difficulty: "Developing",
        requirement: "Implement final_price(price). Prices of 100 or more receive a 10% discount; lower prices remain unchanged.",
        constraints: ["The threshold value 100 is included in the discount rule.", "Return a numeric price."],
        aiCode: `def final_price(price):
    if price > 100:
        return price * 0.9
    return price`,
        issueOptions: [
            { id: "threshold-excluded", label: "The condition excludes the exact price 100.", correct: true, feedback: "The requirement says 100 or more, so the comparison must include equality." },
            { id: "discount-rate", label: "Multiplying by 0.9 applies a 90% discount.", correct: false, feedback: "Keeping 90% of the price is the same as applying a 10% discount." },
            { id: "else-required", label: "Python requires an else before the final return.", correct: false, feedback: "The early return is valid; execution reaches the final return only when the condition is false." }
        ],
        testOptions: [
            { id: "discount-above", label: "final_price(120) == 108.0", diagnostic: true },
            { id: "discount-boundary", label: "final_price(100) == 90.0", diagnostic: true },
            { id: "discount-below", label: "final_price(99) == 99", diagnostic: true },
            { id: "discount-string", label: "final_price('100') == 90", diagnostic: false }
        ],
        requiredTestIds: ["discount-boundary", "discount-below"],
        allTests: [
            { id: "discount-above", name: "Above threshold", expression: "final_price(120)", expectedExpression: "108.0" },
            { id: "discount-boundary", name: "Exact threshold", expression: "final_price(100)", expectedExpression: "90.0" },
            { id: "discount-below", name: "Below threshold", expression: "final_price(99)", expectedExpression: "99" },
            { id: "discount-additional", name: "Additional large price", expression: "final_price(1000)", expectedExpression: "900.0" }
        ],
        solution: `def final_price(price):
    if price >= 100:
        return price * 0.9
    return price`,
        reasonKeywords: ["boundary", "100", "equal", ">="],
        abilities: ["correctness", "boundaries", "testing", "diagnosis"]
    },
    {
        id: "review-count-passing",
        title: "Replace repeated checks with scalable logic",
        category: "Maintainability and scalability",
        difficulty: "Applied",
        requirement: "Implement count_passing(scores). Count every score greater than or equal to 60 for a list of any length, including an empty list.",
        constraints: ["The solution must work when the list length changes.", "Remove the repeated index-by-index checks by using iteration or an equivalent concise construct."],
        aiCode: `def count_passing(scores):
    count = 0
    if scores[0] >= 60:
        count += 1
    if scores[1] >= 60:
        count += 1
    if scores[2] >= 60:
        count += 1
    return count`,
        issueOptions: [
            { id: "fixed-length", label: "The code assumes exactly three scores and fails or ignores data when the length changes.", correct: true, feedback: "Direct indexes 0, 1, and 2 raise IndexError for shorter lists and never inspect a fourth score." },
            { id: "duplicated-logic", label: "The repeated condition should be expressed once with iteration.", correct: true, feedback: "One loop or comprehension makes the rule apply consistently to every item and is easier to change." },
            { id: "threshold-wrong", label: "Passing must use > 60 rather than >= 60.", correct: false, feedback: "The requirement explicitly includes a score of 60." }
        ],
        testOptions: [
            { id: "passing-three", label: "count_passing([50, 60, 90]) == 2", diagnostic: true },
            { id: "passing-empty", label: "count_passing([]) == 0", diagnostic: true },
            { id: "passing-four", label: "count_passing([60, 40, 70, 80]) == 3", diagnostic: true },
            { id: "passing-fixed", label: "Only test lists containing exactly three scores", diagnostic: false }
        ],
        requiredTestIds: ["passing-empty", "passing-four"],
        allTests: [
            { id: "passing-three", name: "Three scores", expression: "count_passing([50, 60, 90])", expectedExpression: "2" },
            { id: "passing-empty", name: "Empty list", expression: "count_passing([])", expectedExpression: "0" },
            { id: "passing-four", name: "Longer list", expression: "count_passing([60, 40, 70, 80])", expectedExpression: "3" },
            { id: "passing-additional", name: "Additional threshold score", expression: "count_passing([60])", expectedExpression: "1" }
        ],
        solution: `def count_passing(scores):
    count = 0
    for score in scores:
        if score >= 60:
            count += 1
    return count`,
        reasonKeywords: ["length", "loop", "repeat", "index", "scal"],
        abilities: ["correctness", "boundaries", "testing", "maintainability", "diagnosis"]
    },
    {
        id: "review-find-index",
        title: "Repair a generated syntax and sentinel defect",
        category: "Debugging and API contracts",
        difficulty: "Challenge",
        requirement: "Implement find_index(items, target). Return the first matching index, or -1 when the target does not occur.",
        constraints: ["The first item has index 0, so 0 cannot also mean not found.", "Return the first match when a value appears more than once."],
        aiCode: `def find_index(items, target)
    for index, item in enumerate(items):
        if item = target:
            return index
    return 0`,
        issueOptions: [
            { id: "missing-colon", label: "The function header is missing a colon.", correct: true, feedback: "A Python def statement must end with a colon before its indented body." },
            { id: "assignment-condition", label: "The condition uses assignment syntax instead of equality comparison.", correct: true, feedback: "Python comparisons use ==. A single = is assignment syntax and is invalid in this condition." },
            { id: "sentinel-zero", label: "Returning 0 for not found conflicts with a valid first-item index.", correct: true, feedback: "The contract requires -1 for no match; index 0 must remain available for a match in the first position." },
            { id: "enumerate-invalid", label: "enumerate() cannot be used with a list.", correct: false, feedback: "enumerate(items) is the standard way to obtain both index and value while iterating." }
        ],
        testOptions: [
            { id: "find-first", label: "find_index(['a', 'b'], 'a') == 0", diagnostic: true },
            { id: "find-middle", label: "find_index(['a', 'b', 'c'], 'b') == 1", diagnostic: true },
            { id: "find-missing", label: "find_index(['a', 'b'], 'x') == -1", diagnostic: true },
            { id: "find-sorted", label: "Only test alphabetically sorted lists", diagnostic: false }
        ],
        requiredTestIds: ["find-first", "find-missing"],
        allTests: [
            { id: "find-first", name: "First item", expression: "find_index(['a', 'b'], 'a')", expectedExpression: "0" },
            { id: "find-middle", name: "Middle item", expression: "find_index(['a', 'b', 'c'], 'b')", expectedExpression: "1" },
            { id: "find-missing", name: "Missing target", expression: "find_index(['a', 'b'], 'x')", expectedExpression: "-1" },
            { id: "find-duplicate", name: "First duplicate", expression: "find_index(['a', 'b', 'a'], 'a')", expectedExpression: "0" }
        ],
        solution: `def find_index(items, target):
    for index, item in enumerate(items):
        if item == target:
            return index
    return -1`,
        reasonKeywords: ["syntax", "colon", "comparison", "-1", "index"],
        abilities: ["correctness", "boundaries", "testing", "diagnosis", "maintainability"]
    },
    {
        id: "review-shipping-tests",
        title: "Reject an AI-written test with the wrong expectation",
        category: "Test reliability",
        difficulty: "Applied",
        requirement: "Implement shipping_fee(total). Orders of 50 or more have free shipping; smaller orders cost 5. The included AI tests must agree with this contract.",
        constraints: ["Review both the function and the assertions below it.", "A test is harmful when its expected value contradicts the requirement."],
        aiCode: `def shipping_fee(total):
    return 0 if total >= 50 else 5

# AI-generated tests
assert shipping_fee(60) == 0
assert shipping_fee(49) == 0`,
        issueOptions: [
            { id: "shipping-wrong-expectation", label: "The assertion for total 49 expects free shipping, contrary to the requirement.", correct: true, feedback: "An order of 49 is below the threshold, so its expected fee must be 5 rather than 0." },
            { id: "shipping-missing-boundary", label: "The AI tests omit the exact threshold value 50.", correct: true, feedback: "The condition uses an inclusive boundary. Testing 50 is the most direct way to detect an accidental > comparison." },
            { id: "shipping-function-wrong", label: "The function must use total > 50 instead of total >= 50.", correct: false, feedback: "The words '50 or more' require >=, so the function's comparison is already correct." },
            { id: "shipping-assert-invalid", label: "Python assert statements cannot call functions.", correct: false, feedback: "An assert may evaluate a function call; the problem is the incorrect expected value, not the syntax." }
        ],
        testOptions: [
            { id: "shipping-above", label: "shipping_fee(60) == 0", diagnostic: true, feedback: "This confirms a clearly qualifying order receives free shipping." },
            { id: "shipping-boundary", label: "shipping_fee(50) == 0", diagnostic: true, feedback: "This proves equality is included at the exact threshold." },
            { id: "shipping-below", label: "shipping_fee(49) == 5", diagnostic: true, feedback: "This distinguishes the below-threshold branch from the free-shipping branch." },
            { id: "shipping-negative", label: "shipping_fee(-10) raises ValueError", diagnostic: false, feedback: "The contract does not specify validation or an exception for negative totals, so this expected exception is unsupported." }
        ],
        requiredTestIds: ["shipping-boundary", "shipping-below"],
        allTests: [
            { id: "shipping-above", name: "Above threshold", expression: "shipping_fee(60)", expectedExpression: "0" },
            { id: "shipping-boundary", name: "Exact threshold", expression: "shipping_fee(50)", expectedExpression: "0" },
            { id: "shipping-below", name: "Below threshold", expression: "shipping_fee(49)", expectedExpression: "5" },
            { id: "shipping-additional", name: "Additional small order", expression: "shipping_fee(1)", expectedExpression: "5" }
        ],
        solution: `def shipping_fee(total):
    return 0 if total >= 50 else 5

assert shipping_fee(60) == 0
assert shipping_fee(50) == 0
assert shipping_fee(49) == 5`,
        reasonKeywords: ["test", "expect", "49", "boundary", "50"],
        abilities: ["correctness", "boundaries", "testing", "diagnosis", "reliability"]
    },
    {
        id: "review-unique-order",
        title: "Preserve order while removing duplicates",
        category: "Hidden logic defects",
        difficulty: "Applied",
        requirement: "Implement unique_in_order(items) for a list of strings. Remove later duplicates while preserving the first-occurrence order.",
        constraints: ["The output order is part of the contract.", "Different correct implementations are acceptable if they preserve first occurrences."],
        aiCode: `def unique_in_order(items):
    return list(set(items))`,
        issueOptions: [
            { id: "unique-order-lost", label: "Converting through set does not express the required first-occurrence order.", correct: true, feedback: "A set represents membership, not the sequence in which values first appeared. The output can violate the order contract." },
            { id: "unique-removes-duplicates", label: "Removing duplicate values is itself incorrect.", correct: false, feedback: "Removing later duplicates is required; only their first-occurrence order must be preserved." },
            { id: "unique-list-invalid", label: "list() cannot convert a set back into a list.", correct: false, feedback: "list(set_value) is valid Python, but it does not guarantee the required semantic order." }
        ],
        testOptions: [
            { id: "unique-ordered-duplicates", label: "unique_in_order(['b', 'a', 'b']) == ['b', 'a']", diagnostic: true, feedback: "This case proves both duplicate removal and preservation of the first-seen order." },
            { id: "unique-no-duplicates", label: "unique_in_order(['a', 'b']) == ['a', 'b']", diagnostic: true, feedback: "This checks that an already unique sequence is not rearranged." },
            { id: "unique-empty", label: "unique_in_order([]) == []", diagnostic: true, feedback: "This confirms the accumulation logic handles an empty sequence." },
            { id: "unique-sorted", label: "unique_in_order(['b', 'a']) == ['a', 'b']", diagnostic: false, feedback: "Sorting contradicts the requirement to retain first-occurrence order." }
        ],
        requiredTestIds: ["unique-ordered-duplicates", "unique-no-duplicates"],
        allTests: [
            { id: "unique-ordered-duplicates", name: "Order with duplicates", expression: "unique_in_order(['b', 'a', 'b'])", expectedExpression: "['b', 'a']" },
            { id: "unique-no-duplicates", name: "Already unique", expression: "unique_in_order(['a', 'b'])", expectedExpression: "['a', 'b']" },
            { id: "unique-empty", name: "Empty list", expression: "unique_in_order([])", expectedExpression: "[]" },
            { id: "unique-additional", name: "Additional repeated values", expression: "unique_in_order(['c', 'a', 'c', 'b', 'a'])", expectedExpression: "['c', 'a', 'b']" }
        ],
        sourceRule: "ordered-unique",
        solution: `def unique_in_order(items):
    seen = set()
    result = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result`,
        reasonKeywords: ["order", "first", "set", "duplicate"],
        abilities: ["correctness", "testing", "diagnosis", "maintainability"]
    },
    {
        id: "review-parse-age",
        title: "Narrow exception handling without hiding defects",
        category: "Reliability and error handling",
        difficulty: "Challenge",
        requirement: "Implement parse_age(text). Return the integer value for valid integer text and return None when conversion fails.",
        constraints: ["The valid age 0 must remain distinguishable from invalid input.", "Catch the conversion error specifically instead of hiding unrelated programming errors."],
        aiCode: `def parse_age(text):
    try:
        return int(text)
    except Exception:
        return 0`,
        issueOptions: [
            { id: "age-wrong-sentinel", label: "Returning 0 for invalid input conflicts with the valid value 0.", correct: true, feedback: "The requirement reserves None for conversion failure. Returning 0 makes invalid text indistinguishable from a real age of zero." },
            { id: "age-broad-except", label: "Catching Exception is broader than the conversion failure being handled.", correct: true, feedback: "int(text) reports invalid conversion with ValueError. Catching unrelated exceptions can conceal defects that should remain visible." },
            { id: "age-int-wrong", label: "The int() function cannot convert numeric text.", correct: false, feedback: "int('18') correctly returns 18; it is the appropriate conversion operation." },
            { id: "age-try-unneeded", label: "Python does not permit return statements inside try blocks.", correct: false, feedback: "Returning from a try block is valid. The concerns are the broad exception and wrong failure value." }
        ],
        testOptions: [
            { id: "age-valid", label: "parse_age('18') == 18", diagnostic: true, feedback: "This proves the normal conversion path." },
            { id: "age-zero", label: "parse_age('0') == 0", diagnostic: true, feedback: "This protects the valid zero value from being confused with failure." },
            { id: "age-invalid", label: "parse_age('unknown') is None", diagnostic: true, feedback: "This verifies the explicit failure contract." },
            { id: "age-invalid-zero", label: "parse_age('unknown') == 0", diagnostic: false, feedback: "That expectation repeats the defect and cannot distinguish invalid text from valid zero." }
        ],
        requiredTestIds: ["age-zero", "age-invalid"],
        allTests: [
            { id: "age-valid", name: "Valid age", expression: "parse_age('18')", expectedExpression: "18" },
            { id: "age-zero", name: "Valid zero", expression: "parse_age('0')", expectedExpression: "0" },
            { id: "age-invalid", name: "Invalid text", expression: "parse_age('unknown')", expectedExpression: "None" },
            { id: "age-additional", name: "Additional negative integer", expression: "parse_age('-2')", expectedExpression: "-2" }
        ],
        sourceRule: "targeted-value-error",
        solution: `def parse_age(text):
    try:
        return int(text)
    except ValueError:
        return None`,
        reasonKeywords: ["ValueError", "None", "zero", "exception"],
        abilities: ["correctness", "testing", "diagnosis", "reliability", "maintainability"]
    },
    {
        id: "review-duplicate-performance",
        title: "Replace quadratic duplicate detection",
        category: "Performance and resource use",
        difficulty: "Challenge",
        requirement: "Implement has_duplicate(items). Return whether any value repeats, and make the solution scale in one pass for large lists.",
        constraints: ["A correct answer that still compares every pair does not meet the performance requirement.", "Use a set or another genuinely linear-time membership strategy."],
        aiCode: `def has_duplicate(items):
    for left in range(len(items)):
        for right in range(left + 1, len(items)):
            if items[left] == items[right]:
                return True
    return False`,
        issueOptions: [
            { id: "duplicate-quadratic", label: "The nested pair comparison performs quadratic work as the list grows.", correct: true, feedback: "For n items, the code may inspect roughly n squared pairs. A membership set can detect repetition in one traversal." },
            { id: "duplicate-readable", label: "The index-based nested loops obscure the simple membership intent.", correct: true, feedback: "The implementation exposes pair mechanics rather than the rule 'have I seen this value before?', making maintenance harder." },
            { id: "duplicate-result-wrong", label: "The function always returns False when a duplicate exists.", correct: false, feedback: "The current code is behaviorally correct for ordinary inputs; its problem is scalability and unnecessary complexity." },
            { id: "duplicate-set-slower", label: "Set membership is always slower than comparing every pair.", correct: false, feedback: "Average set membership is constant time, enabling an average linear-time traversal." }
        ],
        testOptions: [
            { id: "duplicate-present", label: "has_duplicate([1, 2, 1]) is True", diagnostic: true, feedback: "This checks the positive behavior." },
            { id: "duplicate-absent", label: "has_duplicate([1, 2, 3]) is False", diagnostic: true, feedback: "This checks that unique input is not misclassified." },
            { id: "duplicate-late", label: "has_duplicate(list(range(1000)) + [999]) is True", diagnostic: true, feedback: "A late duplicate exercises both correctness and the intended scalable strategy." },
            { id: "duplicate-only-first", label: "Only test [1, 1] because performance cannot be reviewed", diagnostic: false, feedback: "A tiny happy-path test cannot provide evidence that the implementation meets the explicit scalability constraint." }
        ],
        requiredTestIds: ["duplicate-absent", "duplicate-late"],
        allTests: [
            { id: "duplicate-present", name: "Duplicate present", expression: "has_duplicate([1, 2, 1])", expectedExpression: "True" },
            { id: "duplicate-absent", name: "Unique input", expression: "has_duplicate([1, 2, 3])", expectedExpression: "False" },
            { id: "duplicate-late", name: "Late duplicate", expression: "has_duplicate(list(range(1000)) + [999])", expectedExpression: "True" },
            { id: "duplicate-empty", name: "Empty input", expression: "has_duplicate([])", expectedExpression: "False" }
        ],
        sourceRule: "linear-duplicate",
        solution: `def has_duplicate(items):
    seen = set()
    for item in items:
        if item in seen:
            return True
        seen.add(item)
    return False`,
        reasonKeywords: ["set", "linear", "quadratic", "membership", "performance"],
        abilities: ["correctness", "testing", "diagnosis", "maintainability", "efficiency"]
    },
    {
        id: "review-chunk-tail",
        title: "Keep the final partial chunk",
        category: "Boundary and off-by-one review",
        difficulty: "Challenge",
        requirement: "Implement chunk(items, size) for a positive size. Return consecutive sublists and keep a final partial chunk when the length is not divisible by size.",
        constraints: ["The last full chunk must not be dropped.", "A shorter final chunk is valid and must be returned."],
        aiCode: `def chunk(items, size):
    result = []
    for start in range(0, len(items) - size, size):
        result.append(items[start:start + size])
    return result`,
        issueOptions: [
            { id: "chunk-stop-early", label: "The range stop value ends before the last full or partial chunk can start.", correct: true, feedback: "Chunk starts should continue while start is below len(items). Subtracting size shortens the traversal and drops valid data." },
            { id: "chunk-slice-partial", label: "Python slicing cannot return a shorter final sublist.", correct: false, feedback: "A slice safely stops at the list end, which is exactly what makes the partial final chunk easy to preserve." },
            { id: "chunk-append-wrong", label: "append() flattens the sublist instead of storing a chunk.", correct: false, feedback: "append(sublist) stores the sublist as one element; extend() would flatten it." }
        ],
        testOptions: [
            { id: "chunk-exact", label: "chunk([1, 2, 3, 4], 2) == [[1, 2], [3, 4]]", diagnostic: true, feedback: "This catches an implementation that drops the last complete chunk." },
            { id: "chunk-partial", label: "chunk([1, 2, 3, 4, 5], 2) == [[1, 2], [3, 4], [5]]", diagnostic: true, feedback: "This directly proves that the tail is retained." },
            { id: "chunk-empty", label: "chunk([], 3) == []", diagnostic: true, feedback: "This checks a natural boundary without inventing an error requirement." },
            { id: "chunk-drop-tail", label: "chunk([1, 2, 3], 2) == [[1, 2]]", diagnostic: false, feedback: "That expected value contradicts the requirement to keep the final partial chunk." }
        ],
        requiredTestIds: ["chunk-exact", "chunk-partial"],
        allTests: [
            { id: "chunk-exact", name: "Exact division", expression: "chunk([1, 2, 3, 4], 2)", expectedExpression: "[[1, 2], [3, 4]]" },
            { id: "chunk-partial", name: "Partial final chunk", expression: "chunk([1, 2, 3, 4, 5], 2)", expectedExpression: "[[1, 2], [3, 4], [5]]" },
            { id: "chunk-empty", name: "Empty input", expression: "chunk([], 3)", expectedExpression: "[]" },
            { id: "chunk-additional", name: "Chunk larger than input", expression: "chunk([1, 2], 5)", expectedExpression: "[[1, 2]]" }
        ],
        solution: `def chunk(items, size):
    result = []
    for start in range(0, len(items), size):
        result.append(items[start:start + size])
    return result`,
        reasonKeywords: ["range", "stop", "partial", "slice", "tail"],
        abilities: ["correctness", "boundaries", "testing", "diagnosis"]
    }
];

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

const LEVEL_ZERO_STAGE_LABEL = "Choose code blocks";
const LEVEL_STAGE_LABELS = [
    "Fill a key expression",
    "Write one complete line",
    "Write the complete program",
    "Refine redundant code",
    "Fix broken code"
];

function getLevelStageLabel(levelNumber) {
    return Number(levelNumber) === 0
        ? LEVEL_ZERO_STAGE_LABEL
        : LEVEL_STAGE_LABELS[Number(levelNumber) - 1] || `Level ${levelNumber}`;
}

const QUESTION_SET_DIFFICULTY = [
    { label: "Starter", className: "starter", note: "Short code, one core idea, minimal distractors." },
    { label: "Growing", className: "growing", note: "Adds one more variable, branch, or longer sequence." },
    { label: "Applied", className: "applied", note: "Requires tracking multiple state changes." },
    { label: "Challenge", className: "challenge", note: "Longer code with more context and more chances for boundary mistakes." },
    { label: "Capstone", className: "capstone", note: "Most realistic version in this bank: longer, noisier, and more diagnostic." }
];

function getDifficultyMeta(setOrder = 1, levelNumber = 0, task = null) {
    const index = clamp((Number(setOrder) || 1) - 1, 0, QUESTION_SET_DIFFICULTY.length - 1);
    const base = QUESTION_SET_DIFFICULTY[index];
    const lineCount = countCodeLines(task?.starterCode || "");
    const targetLines = Math.max(lineCount, 2 + index + Number(levelNumber || 0));
    return {
        order: index + 1,
        label: base.label,
        className: base.className,
        note: base.note,
        estimatedLines: lineCount,
        targetLines,
        complexityNote: `Set ${index + 1}: ${base.note} Current starter code has ${lineCount} non-empty line${lineCount === 1 ? "" : "s"}.`
    };
}

function countCodeLines(code) {
    return String(code || "")
        .split("\n")
        .filter(line => line.trim().length > 0)
        .length;
}

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
        levelOrder: getTaskLevelNumber(task, index),
        difficulty: getDifficultyMeta(Number(setId.replace("set-", "")) || 1, getTaskLevelNumber(task, index), task)
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

function fillLevelZeroSolution(starterCode, blanks) {
    return blanks.reduce((code, blank) => code.split(blank.token).join(blank.answer), starterCode);
}

function uniqueLevelZeroChoices(answers, distractors) {
    const seen = new Set();
    return [...answers, ...distractors]
        .filter(code => {
            const key = normalizeCodeChoice(code);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .map((code, index) => ({
            id: `choice-${index + 1}`,
            code
        }));
}

function makeLevelZeroTask({ id, title, objective, concepts, starterCode, blanks, distractors, variable, expected, functionHints = [] }) {
    const solution = fillLevelZeroSolution(starterCode, blanks);
    const answers = blanks.map(blank => blank.answer);
    return {
        id,
        title,
        objective,
        taskType: "level-0-choice",
        concepts,
        starterCode,
        blanks,
        choices: uniqueLevelZeroChoices(answers, distractors),
        solution: taskFix(solution),
        errorFix: taskFix(solution),
        algorithmFix: taskFix(solution),
        functionHints,
        checks: [
            ...blanks.map(blank => ({
                type: "blankChoice",
                token: blank.token,
                expected: blank.answer,
                label: blank.label,
                explanation: blank.explanation,
                hint: blank.hint,
                fix: `${blank.token} should be ${blank.answer}.\nWhy: ${blank.explanation}\n\nFull answer:\n${solution}`
            })),
            ...goalChecks({
                variable,
                expected,
                concepts,
                solution
            })
        ]
    };
}

function getLevelZeroVariant(topicId, setOrder) {
    const variantIndex = Math.max(0, (Number(setOrder) || 1) - 1);
    const variants = {
        assignment: [
            { source: "saved_name", value: "Ada", target: "student_name", output: "display_name" },
            { source: "home_city", value: "Paris", target: "city_name", output: "display_city" },
            { source: "pet_source", value: "Milo", target: "pet_name", output: "shown_pet" },
            { source: "course_source", value: "Python", target: "course_name", output: "label" },
            { source: "team_source", value: "Delta", target: "team_name", output: "badge_text" }
        ],
        ifElse: [
            { subject: "score", value: 72, threshold: 60, result: "result", pass: "pass", fail: "retry", op: ">=" },
            { subject: "temperature", value: 12, threshold: 15, result: "coat", pass: "wear coat", fail: "no coat", op: "<" },
            { subject: "stock", value: 0, threshold: 1, result: "status", pass: "sold out", fail: "in stock", op: "<" },
            { subject: "age", value: 18, threshold: 18, result: "access", pass: "allowed", fail: "wait", op: ">=" },
            { subject: "score", value: 91, threshold: 90, result: "grade", pass: "A", fail: "review", op: ">=" }
        ],
        forLoop: [
            { stop: 4, expected: "6" },
            { stop: 6, expected: "15" },
            { stop: 5, expected: "10" },
            { stop: 8, expected: "28" },
            { stop: 7, expected: "21" }
        ],
        whileLoop: [
            { target: 5 },
            { target: 4 },
            { target: 6 },
            { target: 3 },
            { target: 7 }
        ],
        listTraversal: [
            { listName: "colors", items: ["red", "green", "blue"], selected: "first_color", last: "current_color" },
            { listName: "scores", items: [4, 9, 2], selected: "first_score", last: "current_score" },
            { listName: "levels", items: [1, 3, 5, 7], selected: "first_level", last: "current_level" },
            { listName: "weights", items: [6, 2, 8, 4], selected: "first_weight", last: "current_weight" },
            { listName: "points", items: [10, 15, 5], selected: "first_point", last: "current_point" }
        ],
        accumulator: [
            { listName: "numbers", items: [10, 20, 30], totalVar: "total_sum", expected: "60" },
            { listName: "prices", items: [5, 15, 20], totalVar: "total_price", expected: "40" },
            { listName: "scores", items: [12, 8, 10], totalVar: "score_total", expected: "30" },
            { listName: "distances", items: [3, 4, 5], totalVar: "total_distance", expected: "12" },
            { listName: "orders", items: [7, 9, 11], totalVar: "order_total", expected: "27" }
        ],
        nestedLoop: [
            { rows: ["A", "B"], cols: [1, 2, 3], expected: "6" },
            { rows: ["A", "B", "C"], cols: [1, 2], expected: "6" },
            { rows: ["N", "S"], cols: [1, 2, 3, 4], expected: "8" },
            { rows: ["L", "R"], cols: [10, 20], expected: "4" },
            { rows: ["X", "Y", "Z"], cols: [5, 6, 7], expected: "9" }
        ],
        functionCall: [
            { fn: "square", body: "number * number", input: 4, expected: "16" },
            { fn: "triple", body: "number * 3", input: 5, expected: "15" },
            { fn: "add_ten", body: "number + 10", input: 9, expected: "19" },
            { fn: "half", body: "number // 2", input: 20, expected: "10" },
            { fn: "minus_two", body: "number - 2", input: 14, expected: "12" }
        ],
        recursion: [
            { input: 5, expected: "120" },
            { input: 4, expected: "24" },
            { input: 6, expected: "720" },
            { input: 3, expected: "6" },
            { input: 5, expected: "120" }
        ],
        complex: [
            { numbers: [2, 4, 6, 8, 10, 12], target: 8, expectedIndex: "3" },
            { numbers: [3, 6, 9, 12], target: 9, expectedIndex: "2" },
            { numbers: [2, 8, 14, 20, 26], target: 20, expectedIndex: "3" },
            { numbers: [4, 7, 11, 18], target: 7, expectedIndex: "1" },
            { numbers: [10, 15, 21, 28, 36], target: 36, expectedIndex: "4" }
        ]
    };
    const topicVariants = variants[topicId] || variants.assignment;
    return topicVariants[variantIndex % topicVariants.length];
}

function createLevelZeroTask(topicId, setOrder = 1) {
    const cfg = getLevelZeroVariant(topicId, setOrder);
    const prefix = `${topicId}-s${setOrder}-l0`;

    if (topicId === "assignment") {
        const starterCode = `${cfg.source} = "${cfg.value}"\n${cfg.target} = ___1___\n${cfg.output} = ___2___`;
        return makeLevelZeroTask({
            id: prefix,
            title: "Choose valid variable blocks",
            objective: `Fill the blanks with variable names: use ${cfg.source} first, then ${cfg.target}. Do not choose keywords such as for/if or a quoted value.`,
            concepts: ["Variable assignment"],
            starterCode,
            blanks: [
                { token: "___1___", label: `${cfg.target} should read the existing source variable`, answer: cfg.source, explanation: `${cfg.source} is a valid variable name and already stores "${cfg.value}". A keyword such as for/if cannot be used as a value here, and a quoted string would skip variable assignment practice.`, hint: `Use the existing variable name ${cfg.source}; do not use a keyword or quoted text.` },
                { token: "___2___", label: `${cfg.output} should read the copied variable`, answer: cfg.target, explanation: `${cfg.target} is the variable created on the previous line. Copying it proves the value can move through named storage step by step.`, hint: `Use ${cfg.target}, not the original string literal or a Python keyword.` }
            ],
            distractors: [`"${cfg.value}"`, "for", "if", cfg.output],
            variable: cfg.output,
            expected: cfg.value
        });
    }

    if (topicId === "ifElse") {
        const condition = `${cfg.subject} ${cfg.op} ${cfg.threshold}`;
        const starterCode = `${cfg.subject} = ${cfg.value}\nif ___1___:\n    ${cfg.result} = ___2___\nelse:\n    ${cfg.result} = ___3___`;
        return makeLevelZeroTask({
            id: prefix,
            title: "Choose the decision blocks",
            objective: `Choose one valid comparison for the if line, then choose the quoted branch values. A single = or a keyword is not a condition.`,
            concepts: ["Condition"],
            starterCode,
            blanks: [
                { token: "___1___", label: "valid comparison that makes the correct branch run", answer: condition, explanation: `With ${cfg.subject} = ${cfg.value}, ${condition} is a true comparison. Conditions need comparison operators such as ==, <, >, <=, or >=; assignment with = is not allowed in an if condition.`, hint: `Compare ${cfg.subject} with ${cfg.threshold} using a comparison operator.` },
                { token: "___2___", label: "value stored when the condition is true", answer: `"${cfg.pass}"`, explanation: `The true branch should store the target value "${cfg.pass}" because this task expects that branch to run.`, hint: `Use the quoted true-branch value.` },
                { token: "___3___", label: "fallback value for the else branch", answer: `"${cfg.fail}"`, explanation: `The else branch still needs a valid fallback value even though this input should not use it.`, hint: `Use the quoted else value.` }
            ],
            distractors: [`${cfg.subject} = ${cfg.threshold}`, "if", `"${cfg.result}"`, `${cfg.result}`],
            variable: cfg.result,
            expected: cfg.pass
        });
    }

    if (topicId === "forLoop") {
        const starterCode = `total = 0\nfor number in ___1___:\n    total = ___2___`;
        return makeLevelZeroTask({
            id: prefix,
            title: "Choose the for-loop blocks",
            objective: `Choose a range() expression for the loop source and an accumulator expression that keeps the old total.`,
            concepts: ["Loop", "Accumulator"],
            starterCode,
            blanks: [
                { token: "___1___", label: `range that visits 1 through ${cfg.stop - 1}`, answer: `range(1, ${cfg.stop})`, explanation: `range(1, ${cfg.stop}) starts at 1 and stops before ${cfg.stop}, so it visits exactly the values that should be added.`, hint: `The stop value in range() is not included.` },
                { token: "___2___", label: "accumulator update that keeps the previous total", answer: "total + number", explanation: `total + number preserves the running total and adds the current loop value. Using number alone would forget earlier values.`, hint: `Use both total and number.` }
            ],
            distractors: ["for", `range[1, ${cfg.stop}]`, "number", "total = number"],
            variable: "total",
            expected: cfg.expected,
            functionHints: ["range"]
        });
    }

    if (topicId === "whileLoop") {
        const starterCode = `count = 0\nwhile ___1___:\n    count = ___2___`;
        return makeLevelZeroTask({
            id: prefix,
            title: "Choose the while-loop blocks",
            objective: `Choose a stopping condition and an update expression. The condition must eventually become false.`,
            concepts: ["Loop"],
            starterCode,
            blanks: [
                { token: "___1___", label: `condition that keeps looping until ${cfg.target}`, answer: `count < ${cfg.target}`, explanation: `count < ${cfg.target} is true while count is still below the goal and becomes false exactly when count reaches ${cfg.target}.`, hint: `The loop should stop when count reaches ${cfg.target}.` },
                { token: "___2___", label: "update that moves count toward the stop condition", answer: "count + 1", explanation: `count + 1 increases count each pass, so the loop eventually reaches the stop condition. Without this, the loop may not finish.`, hint: `Increase count by one.` }
            ],
            distractors: ["while", `count = ${cfg.target}`, "count - 1", "1"],
            variable: "count",
            expected: String(cfg.target)
        });
    }

    if (topicId === "listTraversal") {
        const listLiteral = `[${cfg.items.map(item => typeof item === "string" ? `"${item}"` : item).join(", ")}]`;
        const starterCode = `${cfg.listName} = ${listLiteral}\n${cfg.selected} = ___1___\nfor item in ${cfg.listName}:\n    ${cfg.last} = ___2___`;
        const expectedLast = String(cfg.items[cfg.items.length - 1]);
        return makeLevelZeroTask({
            id: prefix,
            title: "Choose the list traversal blocks",
            objective: `Choose index 0 for the first item, then choose the loop variable that holds each visited item.`,
            concepts: ["List / sequence", "List traversal"],
            starterCode,
            blanks: [
                { token: "___1___", label: "expression for the first list item", answer: `${cfg.listName}[0]`, explanation: `Python lists start at index 0, so ${cfg.listName}[0] reads the first item.`, hint: `Use index 0 for the first item.` },
                { token: "___2___", label: "value currently visited by the loop", answer: "item", explanation: `Inside the loop, item is the variable that holds the current list value. Assigning it each pass leaves the final item at the end.`, hint: `Use the loop variable item.` }
            ],
            distractors: ["for", `${cfg.listName}[len(${cfg.listName})]`, `"item"`, "0"],
            variable: cfg.last,
            expected: expectedLast
        });
    }

    if (topicId === "accumulator") {
        const listLiteral = `[${cfg.items.join(", ")}]`;
        const starterCode = `${cfg.listName} = ${listLiteral}\n${cfg.totalVar} = ___1___\nfor item in ${cfg.listName}:\n    ${cfg.totalVar} = ___2___\nfinal_total = ___3___`;
        return makeLevelZeroTask({
            id: prefix,
            title: "Choose the accumulator blocks",
            objective: `Choose the zero start, the running-total update, and the final accumulator variable.`,
            concepts: ["Accumulator"],
            starterCode,
            blanks: [
                { token: "___1___", label: "starting value before adding items", answer: "0", explanation: `A sum accumulator starts at 0 because no values have been added yet.`, hint: `A running sum starts from zero.` },
                { token: "___2___", label: "update that keeps previous total and adds item", answer: `${cfg.totalVar} + item`, explanation: `${cfg.totalVar} + item keeps the old running total and adds the current item. Using item alone would reset the total every pass.`, hint: `Use both ${cfg.totalVar} and item.` },
                { token: "___3___", label: "final value after the loop", answer: cfg.totalVar, explanation: `After the loop, ${cfg.totalVar} stores the completed running total, so final_total should copy it.`, hint: `Copy the accumulator variable.` }
            ],
            distractors: ["for", "item", `${cfg.totalVar} = item`, "final_total"],
            variable: "final_total",
            expected: cfg.expected
        });
    }

    if (topicId === "nestedLoop") {
        const rowsLiteral = `[${cfg.rows.map(row => `"${row}"`).join(", ")}]`;
        const colsLiteral = `[${cfg.cols.join(", ")}]`;
        const starterCode = `rows = ${rowsLiteral}\ncols = ${colsLiteral}\npair_count = ___1___\nfor row in rows:\n    for col in cols:\n        pair_count = ___2___`;
        return makeLevelZeroTask({
            id: prefix,
            title: "Choose the nested-loop blocks",
            objective: `Choose the counter start and the one-pair update used by the inner loop.`,
            concepts: ["Nested loop", "Accumulator"],
            starterCode,
            blanks: [
                { token: "___1___", label: "starting count before any pair is visited", answer: "0", explanation: `Before the nested loops run, no row-column pairs have been counted, so the counter starts at 0.`, hint: `Start the counter at zero.` },
                { token: "___2___", label: "update that counts one pair per inner-loop pass", answer: "pair_count + 1", explanation: `The inner loop visits one pair at a time, so pair_count + 1 adds exactly one for each pair.`, hint: `Add one each time the inner loop runs.` }
            ],
            distractors: ["for", "pair_count", "row + col", "pair_count = 1"],
            variable: "pair_count",
            expected: cfg.expected
        });
    }

    if (topicId === "functionCall") {
        const starterCode = `def ${cfg.fn}(number):\n    return ___1___\n\nanswer = ___2___`;
        return makeLevelZeroTask({
            id: prefix,
            title: "Choose the function blocks",
            objective: `Choose the expression returned by the function, then choose the function call that actually runs it.`,
            concepts: ["Function call"],
            starterCode,
            blanks: [
                { token: "___1___", label: "expression returned by the function", answer: cfg.body, explanation: `The function receives number as a parameter, so the return expression must use number to compute the reusable result.`, hint: `Use the parameter named number.` },
                { token: "___2___", label: "function call with the given input", answer: `${cfg.fn}(${cfg.input})`, explanation: `A function definition does not run by itself; ${cfg.fn}(${cfg.input}) calls it and stores the returned value.`, hint: `Call ${cfg.fn} with ${cfg.input}.` }
            ],
            distractors: ["def", cfg.fn, `${cfg.fn}()`, "return number"],
            variable: "answer",
            expected: cfg.expected
        });
    }

    if (topicId === "recursion") {
        const starterCode = `def factorial(n):\n    if n == 1:\n        return ___1___\n    return n * ___2___\n\nanswer = ___3___`;
        return makeLevelZeroTask({
            id: prefix,
            title: "Choose the recursion blocks",
            objective: `Choose the base-case return, the smaller recursive call, and the call that starts the recursion.`,
            concepts: ["Recursion"],
            starterCode,
            blanks: [
                { token: "___1___", label: "base-case value", answer: "1", explanation: `factorial(1) is 1, so the base case must return 1 to stop the recursion correctly.`, hint: `The base case returns the simplest factorial value.` },
                { token: "___2___", label: "recursive call on the smaller problem", answer: "factorial(n - 1)", explanation: `factorial(n - 1) makes the problem smaller each time; calling factorial(n) would never move toward the base case.`, hint: `Use n - 1 inside the recursive call.` },
                { token: "___3___", label: "call that starts the recursion", answer: `factorial(${cfg.input})`, explanation: `The final line must call factorial with the task's input so answer receives the computed result.`, hint: `Call factorial with ${cfg.input}.` }
            ],
            distractors: ["for", "factorial(n)", `factorial(${cfg.input - 1})`, "n - 1"],
            variable: "answer",
            expected: cfg.expected
        });
    }

    const nums = `[${cfg.numbers.join(", ")}]`;
    const starterCode = `numbers = ${nums}\ntarget = ${cfg.target}\nfound_index = -1\nfor index in ___1___:\n    if ___2___:\n        found_index = ___3___\n        break`;
    return makeLevelZeroTask({
        id: prefix,
        title: "Choose the search blocks",
        objective: `Choose the index range, the target comparison, and the index value to store when the target is found.`,
        concepts: ["Loop", "Condition"],
        starterCode,
        blanks: [
            { token: "___1___", label: "range that scans every valid index", answer: "range(len(numbers))", explanation: `range(len(numbers)) creates valid indexes from 0 up to the last list position without going out of range.`, hint: `Use len(numbers) to get the list length.` },
            { token: "___2___", label: "condition that detects the target", answer: "numbers[index] == target", explanation: `numbers[index] reads the current item; comparing it with target tells Python when the search has found the wanted value.`, hint: `Compare the current list item with target.` },
            { token: "___3___", label: "index to store when the target is found", answer: "index", explanation: `When the target is found, index is the current position, so found_index should store index.`, hint: `Store the loop index, not the target value.` }
        ],
        distractors: ["for", "range(numbers)", "numbers == target", "target"],
        variable: "found_index",
        expected: cfg.expectedIndex,
        functionHints: ["range", "len"]
    });
}

function addLevelZeroTasksToQuestionBank(bank) {
    Object.entries(bank).forEach(([topicId, tasks]) => {
        const sets = new Map();
        tasks.forEach(task => {
            const setId = task.setId || "set-1";
            if (!sets.has(setId)) {
                sets.set(setId, {
                    setId,
                    setTitle: task.setTitle || "Set 1",
                    setOrder: task.setOrder || 1
                });
            }
        });

        sets.forEach(set => {
            const alreadyHasLevelZero = tasks.some(task => (task.setId || "set-1") === set.setId && getTaskLevelNumber(task) === 0);
            if (alreadyHasLevelZero) return;
            const levelZeroTask = createLevelZeroTask(topicId, set.setOrder);
            tasks.push({
                ...levelZeroTask,
                setId: set.setId,
                setTitle: set.setTitle,
                setOrder: set.setOrder,
                levelOrder: 0,
                difficulty: getDifficultyMeta(set.setOrder, 0, levelZeroTask)
            });
        });
    });
    return bank;
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

Object.assign(STUDENT_LEVEL_TASKS, addLevelZeroTasksToQuestionBank(buildPracticeTopicQuestionSets()));

const TOPIC_LEVEL_PATHS = Object.fromEntries(
    Object.entries(STUDENT_LEVEL_TASKS).map(([topicId, tasks]) => [topicId, tasks.map(task => task.id)])
);

const WALKTHROUGH_DEMOS = {
    mission: {
        topicId: "accumulator",
        taskId: "accumulator-l2-line",
        solutionCode: `total_sum = 0
prices = [10, 20, 30, 40]

for price in prices:
    total_sum += price`,
        summary: "The walkthrough opens one accumulator level, writes the update line, runs it, and shows the auto-check feedback.",
        steps: ["Open an accumulator level", "Replace pass with the accumulator update", "Run the trace", "Read the pass/fail feedback"]
    },
    prediction: {
        topicId: "accumulator",
        taskId: "accumulator-l2-line",
        solutionCode: `total_sum = 0
prices = [10, 20, 30, 40]

for price in prices:
    total_sum += price`,
        summary: "The walkthrough runs the trace, predicts the first changed variable value, and checks the answer.",
        steps: ["Run the corrected code", "Pause on the first trace step", "Fill the predicted value", "Check the prediction"]
    },
    debug: {
        topicId: "accumulator",
        taskId: "accumulator-l2-line",
        solutionCode: `total_sum = 0
prices = [10, 20, 30, 40]

for price in prices:
    total_sum += price`,
        bugLine: 5,
        bugReason: "The placeholder line does not add the current price into total_sum.",
        summary: "The walkthrough reports the bug line, explains the state problem, fixes the code, and runs the trace.",
        steps: ["Select the suspicious line", "Write the bug explanation", "Submit the bug report", "Fix and run the code"]
    },
    aiReview: {
        topicId: "accumulator",
        taskId: "accumulator-l2-line",
        solutionCode: `total_sum = 0
prices = [10, 20, 30, 40]

for price in prices:
    total_sum += price`,
        summary: "The walkthrough selects the correct review concerns, fixes the AI-style draft, and verifies the result.",
        steps: ["Select the real review concerns", "Submit the AI review", "Improve the code", "Run the trace as evidence"]
    },
    skillTree: {
        topicId: "accumulator",
        taskId: "accumulator-l2-line",
        solutionCode: `total_sum = 0
prices = [10, 20, 30, 40]

for price in prices:
    total_sum += price`,
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
const btnReviewLabView = document.getElementById('btn-review-lab-view');
const btnQualityStudioView = document.getElementById('btn-quality-studio-view');
const btnDashboardView = document.getElementById('btn-dashboard-view');
const btnQuestionBankView = document.getElementById('btn-question-bank-view');
const dashboardSummary = document.getElementById('dashboard-summary');
const dashboardSkillCloud = document.getElementById('dashboard-skill-cloud');
const dashboardTopicTable = document.getElementById('dashboard-topic-table');
const dashboardReviewEvidence = document.getElementById('dashboard-review-evidence');
const questionBankContent = document.getElementById('question-bank-content');
const reviewTaskSelect = document.getElementById('review-task-select');
const reviewProgressLabel = document.getElementById('review-progress-label');
const reviewSessionState = document.getElementById('review-session-state');
const btnReviewNext = document.getElementById('btn-review-next');
const btnReviewPause = document.getElementById('btn-review-pause');
const btnReviewLastAttempt = document.getElementById('btn-review-last-attempt');
const btnReviewRetry = document.getElementById('btn-review-retry');
const reviewRequirement = document.getElementById('review-requirement');
const reviewAiCode = document.getElementById('review-ai-code');
const btnReviewRestore = document.getElementById('btn-review-restore');
const reviewIssueList = document.getElementById('review-issue-list');
const reviewTestList = document.getElementById('review-test-list');
const reviewReason = document.getElementById('review-reason');
const btnReviewEvaluate = document.getElementById('btn-review-evaluate');
const reviewResults = document.getElementById('review-results');
const reviewHistory = document.getElementById('review-history');
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
        title: "4. Fill or edit",
        body: "For Level 0, drag code blocks into the gate below Code. For later levels, change only what the current level asks for.",
        focus: "#blank-slot",
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

function normalizeCodeChoice(value) {
    return String(value ?? '')
        .trim()
        .replace(/\s+/g, " ")
        .replace(/\s*([=+\-*/%(),:<>\[\]])\s*/g, "$1");
}

function getTeacherTaskOverrides() {
    return readJsonStorage(TEACHER_TASK_OVERRIDES_KEY, {});
}

function writeTeacherTaskOverrides(overrides) {
    writeJsonStorage(TEACHER_TASK_OVERRIDES_KEY, overrides);
}

function getTeacherOverrideKey(topicId, taskId) {
    return `${topicId}:${taskId}`;
}

function getTaskGoalCheck(task) {
    return (task?.checks || []).find(check => check.type === "variableEquals") || null;
}

function getEditableTaskSnapshot(task) {
    const goalCheck = getTaskGoalCheck(task);
    return {
        title: task?.title || "",
        objective: task?.objective || "",
        starterCode: task?.starterCode || "",
        solution: stripTaskFixPrefix(task?.teacherSolution || task?.solution || ""),
        variable: goalCheck?.variable || "",
        expected: goalCheck?.expected || "",
        functionHints: (task?.functionHints || []).join(", "),
        blanksJson: JSON.stringify(task?.blanks || [], null, 2),
        choicesJson: JSON.stringify(task?.choices || [], null, 2),
        debugJson: JSON.stringify(task?.debug || null, null, 2)
    };
}

function stripTaskFixPrefix(value) {
    return String(value || "").replace(/^One valid answer:\n/, "");
}

function parseTeacherJsonField(value, fallback, fieldName) {
    const text = String(value || "").trim();
    if (!text) return fallback;
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error(`${fieldName} must be valid JSON. ${error.message}`);
    }
}

function normalizeFunctionHints(value) {
    return String(value || "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}

function syncChecksForTeacherTask(task, override) {
    const variable = override.variable || getTaskGoalCheck(task)?.variable || "";
    const expected = override.expected || getTaskGoalCheck(task)?.expected || "";
    const solution = override.solution || stripTaskFixPrefix(task.solution || "");
    const baseChecks = Array.isArray(override.blanks)
        ? [
            ...override.blanks
                .filter(blank => blank?.token && blank?.answer)
                .map(blank => ({
                    type: "blankChoice",
                    token: blank.token,
                    expected: blank.answer,
                    label: blank.label || blank.token,
                    explanation: blank.explanation || "",
                    hint: blank.hint || "",
                    fix: `${blank.token} should be ${blank.answer}.\nWhy: ${blank.explanation || blank.hint || "This code block fits the surrounding code."}\n\nFull answer:\n${solution}`
                })),
            ...(task.checks || []).filter(check => check.type !== "blankChoice")
        ]
        : (task.checks || []);
    const checks = baseChecks.map(check => {
        if (check.type === "variableEquals") {
            return {
                ...check,
                variable,
                expected,
                fix: taskFix(solution)
            };
        }
        if (check.type === "noErrors") {
            return {
                ...check,
                fix: taskFix(solution)
            };
        }
        if (check.type === "conceptSeen") {
            return {
                ...check,
                fix: taskFix(solution)
            };
        }
        if (check.type === "blankChoice") {
            return {
                ...check,
                fix: `${check.token} should be ${check.expected}.\nWhy: ${check.explanation || check.hint || "This code block fits the surrounding code."}\n\nFull answer:\n${solution}`
            };
        }
        if (check.type === "codeRegex" || check.type === "maxNonEmptyLines" || check.type === "antiShortcut") {
            return {
                ...check,
                fix: taskFix(solution)
            };
        }
        return check;
    });

    if (variable && expected && !checks.some(check => check.type === "variableEquals")) {
        checks.push({ type: "variableEquals", variable, expected, fix: taskFix(solution) });
    }
    if (!checks.some(check => check.type === "noErrors")) {
        checks.unshift({ type: "noErrors", fix: taskFix(solution) });
    }

    return checks;
}

function applyTeacherTaskOverride(topicId, task) {
    const override = getTeacherTaskOverrides()[getTeacherOverrideKey(topicId, task.id)];
    if (!override) {
        const levelNumber = getTaskLevelNumber(task);
        return {
            ...task,
            difficulty: task.difficulty || getDifficultyMeta(task.setOrder || 1, levelNumber, task)
        };
    }

    const merged = {
        ...task,
        title: override.title ?? task.title,
        objective: override.objective ?? task.objective,
        starterCode: override.starterCode ?? task.starterCode,
        blanks: Array.isArray(override.blanks) ? override.blanks : task.blanks,
        choices: Array.isArray(override.choices) ? override.choices : task.choices,
        functionHints: Array.isArray(override.functionHints) ? override.functionHints : task.functionHints,
        debug: override.debug === undefined ? task.debug : override.debug,
        teacherModified: true,
        teacherUpdatedAt: override.updatedAt || "",
        teacherSolution: override.solution || stripTaskFixPrefix(task.solution || "")
    };
    merged.solution = taskFix(merged.teacherSolution);
    merged.errorFix = taskFix(merged.teacherSolution);
    merged.algorithmFix = taskFix(merged.teacherSolution);
    merged.checks = syncChecksForTeacherTask(merged, override);
    merged.difficulty = task.difficulty || getDifficultyMeta(task.setOrder || 1, getTaskLevelNumber(task), task);
    return merged;
}

function getQuestionBankForTopic(topicId) {
    const bank = STUDENT_LEVEL_TASKS[topicId] || PRACTICE_TASKS[topicId] || [];
    return bank.map(task => applyTeacherTaskOverride(topicId, task));
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
    const taskMap = new Map(getQuestionBankForTopic(topicId).map(task => [task.id, task]));
    const taskIds = batch.taskIds || [];
    const hasLevelZero = taskIds.some(taskId => getTaskLevelNumber(taskMap.get(taskId)) === 0);
    return taskIds.length > 0
        && hasLevelZero
        && taskIds.every(taskId => taskMap.has(taskId));
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
                stage: getLevelStageLabel(levelNumber),
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

function isLevelZeroTask(task = getActiveTask()) {
    return task?.taskType === "level-0-choice";
}

function getLevelZeroAttemptKey(topicId = activeLessonId, task = getActiveTask()) {
    const batchId = getTopicBatch(topicId).batchId;
    return `${topicId}:${batchId}:${task?.id || ""}`;
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
            const level = getTaskLevelNumber(task, index);
            return {
                topicId,
                taskId,
                batchId: batch.batchId,
                level,
                stage: getLevelStageLabel(level)
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
    activeView = ["dashboard", "bank", "review", "quality"].includes(view) ? view : "practice";
    syncModeShell();
    renderReviewLab();
    if (typeof renderQualityStudio === "function") renderQualityStudio();
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
    document.body.classList.toggle("review-lab-active", activeView === "review");
    document.body.classList.toggle("quality-studio-active", activeView === "quality");
    btnPracticeView?.classList.toggle("active", activeView === "practice");
    btnReviewLabView?.classList.toggle("active", activeView === "review");
    btnQualityStudioView?.classList.toggle("active", activeView === "quality");
    btnDashboardView?.classList.toggle("active", activeView === "dashboard");
    btnQuestionBankView?.classList.toggle("active", activeView === "bank");

    if (!modeContext) return;

    modeContext.innerHTML = `<strong>Practice flow:</strong> choose a Practice Topic, follow the current Level card, then click Compile & Run. Level 0 uses draggable code blocks; Level 1 uses the fill-in gate; Levels 2-5 are edited in Code.`;
}

function getReviewLabTask(taskId = activeReviewLabTaskId) {
    return REVIEW_LAB_TASKS.find(task => task.id === taskId) || REVIEW_LAB_TASKS[0];
}

function getReviewLabRecords() {
    const records = readJsonStorage(REVIEW_LAB_RECORDS_KEY, []);
    return Array.isArray(records) ? records : [];
}

function getReviewLabProgress() {
    const progress = readJsonStorage(REVIEW_LAB_PROGRESS_KEY, []);
    return new Set(Array.isArray(progress) ? progress : []);
}

function getReviewLabDrafts() {
    const drafts = readJsonStorage(REVIEW_LAB_DRAFTS_KEY, {});
    return drafts && typeof drafts === "object" && !Array.isArray(drafts) ? drafts : {};
}

function getReviewLabDraft(taskId = activeReviewLabTaskId) {
    return getReviewLabDrafts()[taskId] || null;
}

function writeReviewLabDraft(taskId, draft) {
    const drafts = getReviewLabDrafts();
    drafts[taskId] = draft;
    writeJsonStorage(REVIEW_LAB_DRAFTS_KEY, drafts);
}

function removeReviewLabDraft(taskId = activeReviewLabTaskId) {
    const drafts = getReviewLabDrafts();
    delete drafts[taskId];
    writeJsonStorage(REVIEW_LAB_DRAFTS_KEY, drafts);
}

function saveReviewLabDraft(options = {}) {
    if (!reviewAiCode || reviewLabLoadedTaskId !== activeReviewLabTaskId) return null;
    const selectedIssueIds = getCheckedReviewValues("review-issue");
    const selectedTestIds = getCheckedReviewValues("review-test");
    const sameSelection = (left = [], right = []) => [...left].sort().join("|") === [...right].sort().join("|");
    const matchesAcceptedAttempt = reviewLabLastResult?.passed
        && reviewLabLastResult.taskId === activeReviewLabTaskId
        && reviewAiCode.value === (reviewLabLastResult.submittedCode || "")
        && (reviewReason?.value || "") === (reviewLabLastResult.reason || "")
        && sameSelection(selectedIssueIds, reviewLabLastResult.selectedIssueIds)
        && sameSelection(selectedTestIds, reviewLabLastResult.selectedTestIds);
    if (matchesAcceptedAttempt && !options.force) {
        removeReviewLabDraft(activeReviewLabTaskId);
        if (options.announce) reviewLabSessionMessage = "Completed attempt saved in history; there is no unfinished draft.";
        renderReviewSessionState();
        return null;
    }
    const draft = {
        code: reviewAiCode.value,
        reason: reviewReason?.value || "",
        selectedIssueIds,
        selectedTestIds,
        updatedAt: new Date().toISOString()
    };
    writeReviewLabDraft(activeReviewLabTaskId, draft);
    localStorage.setItem(REVIEW_LAB_ACTIVE_KEY, activeReviewLabTaskId);
    if (options.announce) reviewLabSessionMessage = "Draft saved. You can continue this challenge when you return.";
    renderReviewSessionState();
    return draft;
}

function scheduleReviewLabDraftSave() {
    clearTimeout(reviewLabDraftTimer);
    reviewLabDraftTimer = setTimeout(() => {
        reviewLabSessionMessage = "Draft autosaved.";
        saveReviewLabDraft();
    }, 350);
}

function getReviewLabTaskAttempts(taskId = activeReviewLabTaskId) {
    return getReviewLabRecords()
        .map((record, storageIndex) => ({ record, storageIndex }))
        .filter(item => item.record.taskId === taskId);
}

function recordReviewLabAttempt(record) {
    const records = getReviewLabRecords();
    records.push(record);
    writeJsonStorage(REVIEW_LAB_RECORDS_KEY, records.slice(-120));

    if (record.passed) {
        const progress = getReviewLabProgress();
        progress.add(record.taskId);
        writeJsonStorage(REVIEW_LAB_PROGRESS_KEY, [...progress]);
    }

    studentActionLog.push({
        timestamp: record.timestamp,
        actionType: "review-evaluation",
        label: record.title,
        topicId: "ai-review-lab",
        topicTitle: "AI Code Review Lab",
        taskId: record.taskId,
        taskTitle: record.title,
        contentMode: "review-lab",
        result: record.passed ? "passed" : "needs-revision"
    });
}

function setActiveReviewLabTask(taskId) {
    if (reviewLabLoadedTaskId === activeReviewLabTaskId) saveReviewLabDraft();
    activeReviewLabTaskId = getReviewLabTask(taskId).id;
    localStorage.setItem(REVIEW_LAB_ACTIVE_KEY, activeReviewLabTaskId);
    reviewLabLoadedTaskId = null;
    reviewLabLastResult = null;
    reviewLabSessionMessage = "";
    renderReviewLab();
}

function renderReviewLab() {
    if (!reviewTaskSelect || !reviewRequirement || !reviewAiCode || !reviewResults) return;

    const task = getReviewLabTask();
    const progress = getReviewLabProgress();
    const completedCount = REVIEW_LAB_TASKS.filter(item => progress.has(item.id)).length;
    const draft = getReviewLabDraft(task.id);
    const resultSelections = reviewLabLastResult?.taskId === task.id ? reviewLabLastResult : null;
    const selectedIssueIds = new Set(draft?.selectedIssueIds || resultSelections?.selectedIssueIds || []);
    const selectedTestIds = new Set(draft?.selectedTestIds || resultSelections?.selectedTestIds || []);
    const difficultyOrder = ["Starter", "Developing", "Applied", "Challenge"];

    reviewTaskSelect.innerHTML = difficultyOrder.map(difficulty => {
        const tasks = REVIEW_LAB_TASKS.filter(item => item.difficulty === difficulty);
        if (!tasks.length) return "";
        return `<optgroup label="${escapeHtml(difficulty)}">${tasks.map(item => {
            const index = REVIEW_LAB_TASKS.findIndex(candidate => candidate.id === item.id);
            return `<option value="${escapeHtml(item.id)}" ${item.id === task.id ? "selected" : ""}>${progress.has(item.id) ? "Completed - " : ""}${index + 1}. ${escapeHtml(item.title)}</option>`;
        }).join("")}</optgroup>`;
    }).join("");

    reviewProgressLabel.innerHTML = `<strong>${completedCount}/${REVIEW_LAB_TASKS.length} challenges demonstrated</strong>&nbsp; Each challenge records diagnosis, test design, repair, and explanation evidence.`;
    reviewRequirement.innerHTML = `
        <div>
            <h2>${escapeHtml(task.title)}</h2>
            <p><strong>${escapeHtml(task.category)}</strong> · ${escapeHtml(task.difficulty)}</p>
        </div>
        <p>${escapeHtml(task.requirement)}</p>
        <ul class="review-constraint-list">
            ${task.constraints.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
    `;

    reviewIssueList.innerHTML = task.issueOptions.map(option => `
        <label class="review-option-row">
            <input type="checkbox" name="review-issue" value="${escapeHtml(option.id)}" ${selectedIssueIds.has(option.id) ? "checked" : ""}>
            <span><strong>${escapeHtml(option.label)}</strong>Select only if this claim identifies a real defect or quality problem.</span>
        </label>
    `).join("");

    reviewTestList.innerHTML = task.testOptions.map(option => `
        <label class="review-option-row">
            <input type="checkbox" name="review-test" value="${escapeHtml(option.id)}" ${selectedTestIds.has(option.id) ? "checked" : ""}>
            <span><strong>${escapeHtml(option.label)}</strong>Use this test only if it provides valid evidence for the stated contract.</span>
        </label>
    `).join("");

    if (reviewLabLoadedTaskId !== task.id) {
        reviewAiCode.value = draft?.code ?? task.aiCode;
        reviewReason.value = draft?.reason ?? "";
        reviewLabLoadedTaskId = task.id;
    }

    renderReviewSessionState();
    renderReviewLabResult(reviewLabLastResult);
    renderReviewHistory();
}

function renderReviewSessionState() {
    if (!reviewSessionState) return;
    const draft = getReviewLabDraft();
    const attempts = getReviewLabTaskAttempts();
    const progress = getReviewLabProgress();
    const draftLabel = draft
        ? `Draft saved ${new Date(draft.updatedAt).toLocaleString()}`
        : "No saved draft yet";
    const completionLabel = progress.has(activeReviewLabTaskId)
        ? "Challenge demonstrated; a new attempt can be used for review practice."
        : `${attempts.length} evaluated attempt${attempts.length === 1 ? "" : "s"}.`;
    reviewSessionState.innerHTML = `
        <span><strong>${escapeHtml(reviewLabSessionMessage || draftLabel)}</strong></span>
        <span>${escapeHtml(completionLabel)}</span>
    `;
    if (btnReviewLastAttempt) btnReviewLastAttempt.disabled = attempts.length === 0;
}

function getCheckedReviewValues(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
}

function evaluateReviewSource(task, code) {
    const checks = [];
    const normalizedCode = String(code || "");
    if (task.requiresCodeChange !== false) {
        checks.push({
            passed: normalizedCode.trim() !== task.aiCode.trim(),
            label: "The submitted fix changes the generated code rather than approving it unchanged."
        });
    }

    if (task.id === "review-count-passing") {
        checks.push({
            passed: /\bfor\b|\bwhile\b|\bsum\s*\(/.test(normalizedCode),
            label: "The solution replaces fixed index-by-index checks with iteration or an equivalent scalable construct."
        });
    }

    if (task.sourceRule === "targeted-value-error") {
        checks.push({
            passed: /except\s+ValueError(?:\s+as\s+[A-Za-z_]\w*)?\s*:/.test(normalizedCode) && !/except\s*:|except\s+Exception(?:\s+as\s+[A-Za-z_]\w*)?\s*:/.test(normalizedCode),
            label: "The repair catches ValueError specifically and does not hide unrelated exceptions."
        });
    }

    if (task.sourceRule === "linear-duplicate") {
        const usesLinearMembership = /\bset\s*\(|\bset\s*\(\s*\)|dict\.fromkeys\s*\(/.test(normalizedCode);
        const loopCount = (normalizedCode.match(/\bfor\b/g) || []).length;
        checks.push({
            passed: usesLinearMembership && loopCount <= 1,
            label: "The repair uses set/dictionary membership without retaining the quadratic nested-loop scan."
        });
    }

    if (task.sourceRule === "ordered-unique") {
        const discardsOrderThroughSetConversion = /list\s*\(\s*set\s*\(/.test(normalizedCode);
        const expressesFirstSeenOrder = /dict\.fromkeys\s*\(|\.append\s*\(|\byield\b/.test(normalizedCode);
        checks.push({
            passed: !discardsOrderThroughSetConversion && expressesFirstSeenOrder,
            label: "The repair explicitly preserves first-seen order instead of converting a set directly back to a list."
        });
    }

    return checks;
}

function assessReviewSelections(task, selectedIssueIds, selectedTestIds) {
    const correctIssueIds = task.issueOptions.filter(option => option.correct).map(option => option.id);
    const missingIssueIds = correctIssueIds.filter(id => !selectedIssueIds.includes(id));
    const incorrectIssueIds = selectedIssueIds.filter(id => !correctIssueIds.includes(id));
    const missingTestIds = task.requiredTestIds.filter(id => !selectedTestIds.includes(id));
    const invalidTestIds = selectedTestIds.filter(id => !task.testOptions.find(option => option.id === id)?.diagnostic);

    return {
        issuePassed: missingIssueIds.length === 0 && incorrectIssueIds.length === 0,
        testDesignPassed: missingTestIds.length === 0 && invalidTestIds.length === 0,
        missingIssueIds,
        incorrectIssueIds,
        missingTestIds,
        invalidTestIds
    };
}

async function evaluateReviewLab() {
    if (reviewLabRunning) return;

    const task = getReviewLabTask();
    const code = reviewAiCode.value;
    const reason = reviewReason.value.trim();
    const selectedIssueIds = getCheckedReviewValues("review-issue");
    const selectedTestIds = getCheckedReviewValues("review-test");
    const selection = assessReviewSelections(task, selectedIssueIds, selectedTestIds);
    const sourceChecks = evaluateReviewSource(task, code);
    const sourcePassed = sourceChecks.every(check => check.passed);
    const normalizedReason = reason.toLowerCase();
    const reasonKeywordFound = (task.reasonKeywords || []).some(keyword => normalizedReason.includes(String(keyword).toLowerCase()));
    const reasonPassed = reason.length >= 45 && (reasonKeywordFound || reason.length >= 100);
    saveReviewLabDraft();

    reviewLabRunning = true;
    btnReviewEvaluate.disabled = true;
    btnReviewEvaluate.textContent = "Running Evidence...";
    reviewResults.innerHTML = `<div class="review-feedback-box">Running the repaired code against normal, boundary, and additional checks...</div>`;

    let responseData = { passed: false, tests: [], error: "" };
    try {
        const response = await fetch("/api/execution/review-tests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, tests: task.allTests })
        });
        const responseText = await response.text();
        if (!response.ok) throw new Error(responseText || `Review test request failed (${response.status}).`);
        responseData = JSON.parse(responseText);
    } catch (error) {
        responseData = { passed: false, tests: [], error: error.message || "The review test engine could not run." };
    } finally {
        reviewLabRunning = false;
        btnReviewEvaluate.disabled = false;
        btnReviewEvaluate.textContent = "Evaluate Review & Fix";
    }

    const runtimePassed = Boolean(responseData.passed);
    const infrastructureFailure = /Python 3 is not available|No installed Python|Failed to fetch|review test request failed \(404\)/i.test(responseData.error || "");
    const passed = selection.issuePassed && selection.testDesignPassed && runtimePassed && sourcePassed && reasonPassed;
    const priorAttempts = getReviewLabRecords().filter(record => record.taskId === task.id).length;
    const result = {
        timestamp: new Date().toISOString(),
        taskId: task.id,
        title: task.title,
        abilities: task.abilities,
        selectedIssueIds,
        selectedTestIds,
        submittedCode: code,
        reason,
        reasonKeywordFound,
        issuePassed: selection.issuePassed,
        testDesignPassed: selection.testDesignPassed,
        runtimePassed,
        infrastructureFailure,
        sourcePassed,
        reasonPassed,
        passed,
        sourceChecks,
        tests: Array.isArray(responseData.tests) ? responseData.tests : [],
        engineError: responseData.error || "",
        missingIssueIds: selection.missingIssueIds,
        incorrectIssueIds: selection.incorrectIssueIds,
        missingTestIds: selection.missingTestIds,
        invalidTestIds: selection.invalidTestIds,
        attemptNumber: priorAttempts + 1
    };

    if (!infrastructureFailure) recordReviewLabAttempt(result);
    if (passed) removeReviewLabDraft(task.id);
    reviewLabLastResult = result;
    reviewLabSessionMessage = infrastructureFailure
        ? "Environment check failed; this was not counted as a student attempt."
        : passed
        ? "Challenge evidence accepted and saved."
        : "Attempt saved. Revise the highlighted evidence and try again.";
    renderReviewLab();
    renderDashboard();
}

function getReviewOptionLabel(options, id) {
    return options.find(option => option.id === id)?.label || id;
}

function getReviewOptionFeedback(options, id) {
    return options.find(option => option.id === id)?.feedback || "Compare this choice directly with the stated contract.";
}

function getReviewNextAction(result) {
    if (result.engineError) {
        return /Python 3 is not available|No installed Python/i.test(result.engineError)
            ? "Install Python 3 and confirm python --version or py -3 --version works, then evaluate again."
            : "Fix the first syntax or runtime error shown below before changing any later logic.";
    }
    if (!result.issuePassed) return "Re-read the requirement one sentence at a time, then revise the issue choices using the explanations below.";
    if (!result.testDesignPassed) return "Add the missing boundary evidence and remove any test whose expected result is unsupported by the contract.";
    if (!result.runtimePassed) {
        const failed = (result.tests || []).find(test => !test.passed);
        return failed ? `Trace the case '${failed.name}' by hand, then revise the line that first produces ${failed.actual || "an error"}.` : "Run the repair against the stated boundary cases and revise the first failing behavior.";
    }
    if (!result.sourcePassed) return (result.sourceChecks || []).find(check => !check.passed)?.label || "Revise the code structure to meet the engineering constraint.";
    if (!result.reasonPassed) return "Name the defect, identify the test that exposes it, and explain why the repaired logic now satisfies the contract.";
    return "Move to the next challenge, or start a new attempt later to check that the reasoning remains independent.";
}

function renderReviewLabResult(result) {
    if (!reviewResults) return;
    if (!result) {
        reviewResults.innerHTML = `
            <div class="review-feedback-box">
                Select the real defects and useful tests, repair the AI-generated code, then explain why your change satisfies the requirement. Evaluation accepts different correct implementations.
            </div>
        `;
        return;
    }

    const task = getReviewLabTask(result.taskId);
    const missingIssueIds = result.missingIssueIds || [];
    const incorrectIssueIds = result.incorrectIssueIds || [];
    const missingTestIds = result.missingTestIds || [];
    const invalidTestIds = result.invalidTestIds || [];
    const diagnosisDetails = [
        ...missingIssueIds.map(id => `Missed: ${getReviewOptionLabel(task.issueOptions, id)} ${getReviewOptionFeedback(task.issueOptions, id)}`),
        ...incorrectIssueIds.map(id => `Not a defect: ${getReviewOptionLabel(task.issueOptions, id)} ${getReviewOptionFeedback(task.issueOptions, id)}`)
    ];
    const testDetails = [
        ...missingTestIds.map(id => `Missing evidence: ${getReviewOptionLabel(task.testOptions, id)} ${getReviewOptionFeedback(task.testOptions, id)}`),
        ...invalidTestIds.map(id => `Invalid evidence: ${getReviewOptionLabel(task.testOptions, id)} ${getReviewOptionFeedback(task.testOptions, id)}`)
    ];
    const attemptCount = getReviewLabRecords().filter(record => record.taskId === task.id).length;
    const showReference = !result.passed && !result.infrastructureFailure && attemptCount >= 3;

    const scoreItems = [
        { label: "Diagnosis", passed: result.issuePassed, detail: result.issuePassed ? "Real defects identified without false claims." : `${missingIssueIds.length} real issue(s) missed; ${incorrectIssueIds.length} false claim(s) selected.` },
        { label: "Test Design", passed: result.testDesignPassed, detail: result.testDesignPassed ? "Required normal and boundary evidence selected." : `${missingTestIds.length} required test(s) missing; ${invalidTestIds.length} unsupported test(s) selected.` },
        { label: "Executable Fix", passed: result.runtimePassed, detail: result.runtimePassed ? "All behavior checks passed." : "One or more normal or boundary checks failed." },
        { label: "Code Structure", passed: result.sourcePassed, detail: result.sourcePassed ? "The repair meets the stated structural constraints." : result.sourceChecks.filter(check => !check.passed).map(check => check.label).join(" ") },
        { label: "Reasoning", passed: result.reasonPassed, detail: result.reasonPassed ? "The explanation names task-specific reasoning and is detailed enough to review." : `Write at least 45 characters and refer to a relevant idea such as ${task.reasonKeywords.slice(0, 3).join(", ")}. A detailed 100-character explanation is also accepted.` }
    ];

    const testRows = result.tests.length
        ? result.tests.map(test => `
            <div class="review-test-result ${test.passed ? "pass" : ""}">
                <strong>${test.passed ? "PASS" : "FIX"}</strong>
                <span><strong>${escapeHtml(test.name)}</strong><br>${test.passed
                    ? `Actual ${escapeHtml(test.actual)} matched expected ${escapeHtml(test.expected)}.`
                    : escapeHtml(test.error || `Actual ${test.actual}; expected ${test.expected}.`)}</span>
            </div>
        `).join("")
        : `<div class="review-test-result"><strong>FIX</strong><span>${escapeHtml(result.engineError || "No test evidence was returned. Check the Python syntax and try again.")}</span></div>`;

    reviewResults.innerHTML = `
        <div class="review-result-heading">
            <strong>${result.infrastructureFailure ? "Environment not ready" : result.passed ? "Review evidence accepted" : "Revision still needed"}</strong>
            <span>${result.infrastructureFailure ? "Not counted as an attempt" : `Attempt ${result.attemptNumber}`} · ${new Date(result.timestamp).toLocaleString()}</span>
        </div>
        <div class="review-feedback-box ${result.passed ? "passed" : "failed"}">
            ${result.infrastructureFailure
                ? "The execution service could not verify Python code. Your draft remains saved, and no student evidence or failed attempt was recorded."
                : result.passed
                ? "You demonstrated that the repair matches the requirement and supported it with review evidence. This challenge is now recorded on the Dashboard."
                : "Use the evidence below to revise one decision at a time. A different implementation is welcome when it passes the behavior and structure checks."}
        </div>
        <div class="review-score-grid">
            ${scoreItems.map(item => `
                <div class="review-score-item ${item.passed ? "pass" : "fix"}">
                    <strong>${item.passed ? "PASS" : "FIX"} · ${escapeHtml(item.label)}</strong>
                    <span>${escapeHtml(item.detail)}</span>
                </div>
            `).join("")}
        </div>
        ${diagnosisDetails.length || testDetails.length ? `
            <div class="review-feedback-box failed">
                <strong>Decision feedback</strong>
                ${[...diagnosisDetails, ...testDetails].map(detail => `<p>${escapeHtml(detail)}</p>`).join("")}
            </div>
        ` : ""}
        <div class="review-test-results">${testRows}</div>
        <div class="review-feedback-box review-next-action">
            <strong>Next action</strong>
            <p>${escapeHtml(getReviewNextAction(result))}</p>
        </div>
        ${showReference ? `
            <div class="review-feedback-box failed">
                <strong>Reference repair after three attempts</strong>
                <p>This is one valid answer, not the only acceptable wording or implementation.</p>
                <pre>${escapeHtml(task.solution)}</pre>
                <p>${task.issueOptions.filter(option => option.correct).map(option => escapeHtml(option.feedback)).join(" ")}</p>
            </div>
        ` : ""}
    `;
}

function renderReviewHistory() {
    if (!reviewHistory) return;
    const attempts = getReviewLabTaskAttempts().slice(-6).reverse();
    if (!attempts.length) {
        reviewHistory.innerHTML = `<div class="review-history-empty">No evaluated attempt yet. Draft changes are saved separately and do not count as evidence until Evaluate Review & Fix is clicked.</div>`;
        return;
    }

    reviewHistory.innerHTML = attempts.map(({ record, storageIndex }) => {
        const signals = [
            ["Diagnosis", record.issuePassed],
            ["Tests", record.testDesignPassed],
            ["Fix", record.runtimePassed],
            ["Structure", record.sourcePassed],
            ["Reason", record.reasonPassed]
        ];
        return `
            <div class="review-history-row ${record.passed ? "passed" : ""}">
                <strong>#${record.attemptNumber || storageIndex + 1}</strong>
                <div>
                    <strong>${record.passed ? "Evidence accepted" : "Revision needed"}</strong>
                    <div class="review-history-meta">${new Date(record.timestamp).toLocaleString()}</div>
                </div>
                ${signals.map(([label, passed]) => `<span class="review-history-signal ${passed ? "pass" : ""}">${passed ? "PASS" : "FIX"}<br>${label}</span>`).join("")}
                <button class="secondary-btn review-history-open" type="button" data-review-record-index="${storageIndex}">Review</button>
            </div>
        `;
    }).join("");
}

function loadReviewLabAttempt(storageIndex) {
    const record = getReviewLabRecords()[Number(storageIndex)];
    if (!record) return;
    if (reviewLabLoadedTaskId === activeReviewLabTaskId) saveReviewLabDraft();

    activeReviewLabTaskId = getReviewLabTask(record.taskId).id;
    localStorage.setItem(REVIEW_LAB_ACTIVE_KEY, activeReviewLabTaskId);
    writeReviewLabDraft(activeReviewLabTaskId, {
        code: record.submittedCode || getReviewLabTask(record.taskId).aiCode,
        reason: record.reason || "",
        selectedIssueIds: record.selectedIssueIds || [],
        selectedTestIds: record.selectedTestIds || [],
        updatedAt: new Date().toISOString()
    });
    reviewLabLoadedTaskId = null;
    reviewLabLastResult = record;
    reviewLabSessionMessage = `Reviewing attempt ${record.attemptNumber || ""}. Edit it or start a new attempt.`;
    renderReviewLab();
}

function reviewLastLabAttempt() {
    const attempts = getReviewLabTaskAttempts();
    if (!attempts.length) return;
    loadReviewLabAttempt(attempts[attempts.length - 1].storageIndex);
}

function startNewReviewLabAttempt() {
    removeReviewLabDraft();
    reviewLabLoadedTaskId = null;
    reviewLabLastResult = null;
    reviewLabSessionMessage = getReviewLabProgress().has(activeReviewLabTaskId)
        ? "New review attempt started. Previous mastery evidence remains in history."
        : "New attempt started from the original AI-generated code.";
    renderReviewLab();
}

function pauseReviewLab() {
    saveReviewLabDraft({ announce: true });
    setActiveView("practice");
}

function openNextReviewLabTask() {
    const progress = getReviewLabProgress();
    const currentIndex = REVIEW_LAB_TASKS.findIndex(task => task.id === activeReviewLabTaskId);
    const nextIncomplete = REVIEW_LAB_TASKS.find((task, index) => index > currentIndex && !progress.has(task.id))
        || REVIEW_LAB_TASKS.find(task => !progress.has(task.id));
    const nextTask = nextIncomplete || REVIEW_LAB_TASKS[(currentIndex + 1) % REVIEW_LAB_TASKS.length];
    setActiveReviewLabTask(nextTask.id);
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
    const path = getPracticePath(activeLessonId);
    const levelNumber = activeMissionIndex >= 0 ? path[activeMissionIndex]?.level : null;
    const levelPrefix = levelNumber !== null && levelNumber !== undefined ? `Level ${levelNumber}` : "This level";

    if (task?.taskType === "level-0-choice") {
        return [
            `${levelPrefix}: use the Code Block Gate below Code. Fill every blank with the block that matches its label.`,
            `Key check: avoid syntax traps. Python keywords such as for, if, def, and while are not variable names or expression values.`
        ];
    }

    if (task?.taskType === "level-1-blank") {
        return [
            `${levelPrefix}: type the missing fragment in the Fill-in-the-blank gate below Code.`,
            `Fill: ${getBlankTaskSummary(task)}. The level passes when ${goal}.`
        ];
    }

    if (task?.taskType === "level-2-line") {
        return [
            `${levelPrefix}: replace only the placeholder line, such as pass, with one complete Python line.`,
            `Keep the surrounding starter code. The level passes when ${goal}.`
        ];
    }

    if (task?.taskType === "level-3-program") {
        return [
            `${levelPrefix}: write the complete working logic from the starter comments.`,
            `Create the needed variables, loops, conditions, or calls. The trace must prove ${goal}.`
        ];
    }

    if (task?.taskType === "level-4-refactor") {
        return [
            `${levelPrefix}: keep the same result, but replace repeated/noisy code with the topic pattern.`,
            `The level passes when ${goal} and the quality check accepts the refined code.`
        ];
    }

    if (task?.taskType === "level-5-debug") {
        return [
            `${levelPrefix}: find the real bug, repair it, and avoid a direct final-answer shortcut.`,
            `The level passes when the program runs cleanly and ${goal}.`
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
            <div class="mission-action-title">${currentCompleted ? "Review hint" : "Required hint"}</div>
            ${steps.map((step, index) => `
                <div class="mission-action-row">
                    <strong>${index === 0 ? "Do" : "Hint"}</strong>
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
    const missionCards = path.map((mission, index) => {
        const task = getTasksForTopic(mission.topicId).find(item => item.id === mission.taskId);
        const unlocked = isMissionLevelAccessible(index, completed, path);
        const active = mission.topicId === activeLessonId && mission.taskId === activeTaskId;
        const missionCompleted = isMissionCompleted(mission, completed);
        const state = missionCompleted ? "Completed" : active ? "Current" : unlocked ? "Ready" : "Locked";
        return `
            <button class="mission-card ${active ? "active" : ""} ${missionCompleted ? "completed" : ""}" type="button"
                data-mission-topic="${escapeHtml(mission.topicId)}" data-mission-task="${escapeHtml(mission.taskId)}" ${unlocked ? "" : "disabled"}>
                <strong>Level ${mission.level}: ${escapeHtml(mission.stage)}</strong>
                <span>${escapeHtml(task?.title || "Practice task")}</span>
                <span>${state}</span>
            </button>
        `;
    }).join("");

    const activeLevelText = activeMissionIndex >= 0 ? `Level ${path[activeMissionIndex]?.level}` : "Selected practice";
    const nextReadyMission = path.find((mission, index) => {
        if (index <= activeMissionIndex) return false;
        return !isMissionCompleted(mission, completed) && isMissionLevelAccessible(index, completed, path);
    });
    const completeLine = currentCompleted
        ? nextReadyMission
            ? "This level is already completed. Click the next Ready level card to continue."
            : "This topic path is complete. Open Dashboard to review your growth."
        : activeTask?.taskType === "level-0-choice"
            ? "Not completed yet. Fill the Code Block Gate, then click Compile & Run."
            : activeTask?.taskType === "level-1-blank"
                ? "Not completed yet. Fill the blank gate, then click Compile & Run."
                : "Not completed yet. Edit Code, then click Compile & Run.";

    return `
        <div class="mode-panel">
            <div class="mission-current">
                <strong>${escapeHtml(LESSONS[activeLessonId]?.title || "Practice")} - ${escapeHtml(activeLevelText)}: ${escapeHtml(path[activeMissionIndex]?.stage || "Practice")}</strong>
                <span><b>Task:</b> ${escapeHtml(activeTask?.objective || "Make the program meet the task goal.")}</span>
                <span><b>Status:</b> ${escapeHtml(completeLine)}</span>
            </div>
            ${renderPracticeActionGuide(activeTask, activeMissionIndex, currentCompleted)}
            ${renderMissionRunFeedback(lastLessonResult)}
            ${activeTask?.taskType === "level-5-debug" ? renderDebugRunFeedback(lastLessonResult, activeTask, meta) : ""}
            ${activeTask?.taskType === "level-5-debug" ? renderDebugDetectiveActivity(meta) : ""}
            <div class="mission-grid">${missionCards}</div>
        </div>
    `;
}

function renderMissionRules(extraClass = "", totalLevels = getPracticePath(activeLessonId).length || 5) {
    return `
        <div class="mission-rules ${escapeHtml(extraClass)}">
            <div><strong>Goal:</strong> complete Level 0 to Level ${Math.max(5, totalLevels - 1)} in order for the selected topic.</div>
            <div><strong>How to complete a level:</strong> choose code blocks, fill the key expression, or edit Code, then click Compile & Run.</div>
            <div><strong>Auto-check:</strong> the app marks a level Completed automatically when Compile & Run meets all task checks.</div>
        </div>
    `;
}

function renderMissionRunFeedback(result) {
    if (!result) {
        return "";
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
    dashboardSummary.innerHTML = "";
    dashboardSummary.hidden = true;

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

    renderReviewDashboardEvidence();
    if (typeof renderQualityDashboardEvidence === "function") renderQualityDashboardEvidence();
}

function renderReviewDashboardEvidence() {
    if (!dashboardReviewEvidence) return;

    const records = getReviewLabRecords();
    const completed = getReviewLabProgress();
    const abilities = [
        { id: "diagnosis", label: "Defect diagnosis", criterion: record => record.issuePassed },
        { id: "testing", label: "Test design", criterion: record => record.testDesignPassed },
        { id: "correctness", label: "Behavioral correctness", criterion: record => record.runtimePassed },
        { id: "boundaries", label: "Boundary reasoning", criterion: record => record.testDesignPassed && record.runtimePassed },
        { id: "maintainability", label: "Maintainable repair", criterion: record => record.sourcePassed && record.runtimePassed },
        { id: "reliability", label: "Reliability and error handling", criterion: record => record.issuePassed && record.runtimePassed },
        { id: "efficiency", label: "Performance reasoning", criterion: record => record.sourcePassed && record.runtimePassed }
    ];

    const rows = abilities.map(ability => {
        const relevant = records.filter(record => (record.abilities || []).includes(ability.id));
        const evidenceCount = relevant.filter(ability.criterion).length;
        const passedChallenges = new Set(relevant.filter(record => record.passed).map(record => record.taskId)).size;
        const state = passedChallenges > 0 ? "Demonstrated" : evidenceCount > 0 ? "Developing" : relevant.length ? "Needs revision" : "Not observed";
        const evidence = relevant.length
            ? `${evidenceCount} successful evidence checks across ${relevant.length} attempt${relevant.length === 1 ? "" : "s"}.`
            : "Complete a Review Lab challenge to create evidence.";
        return { ...ability, state, evidence };
    });

    dashboardReviewEvidence.innerHTML = `
        <div class="review-dashboard">
            <div class="review-dashboard-summary">
                <strong>${completed.size}/${REVIEW_LAB_TASKS.length} review challenges demonstrated.</strong>
                These states come from the student's diagnosis, chosen tests, executable repair, and written justification, not from activity time alone.
            </div>
            <div class="review-ability-list">
                ${rows.map(row => `
                    <div class="review-ability-row">
                        <strong>${escapeHtml(row.label)}</strong>
                        <span>${escapeHtml(row.evidence)}</span>
                        <span class="review-evidence-state">${escapeHtml(row.state)}</span>
                    </div>
                `).join("")}
            </div>
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
            ${renderQuestionBankEditor()}
            <div class="bank-toolbar">
                <span><strong>Full question bank:</strong> click any task to inspect and edit it. Later sets are labeled as longer, harder versions for teacher planning.</span>
                <button class="secondary-btn bank-refresh-topic" type="button" data-bank-refresh-topic="${escapeHtml(activeLessonId)}">Update Current Topic</button>
            </div>
            ${topicCards}
        </div>
    `;
}

function getQuestionBankTask(topicId, taskId) {
    return getQuestionBankForTopic(topicId).find(task => task.id === taskId) || null;
}

function renderQuestionBankEditor() {
    if (!activeBankEditorTask) return "";
    const { topicId, taskId } = activeBankEditorTask;
    const task = getQuestionBankTask(topicId, taskId);
    if (!task) return "";

    const snapshot = getEditableTaskSnapshot(task);
    const level = getTaskLevelNumber(task);
    const difficulty = task.difficulty || getDifficultyMeta(task.setOrder || 1, level, task);
    const inCurrentBatch = isTaskInCurrentBatch(topicId, task.id);
    const modifiedText = task.teacherModified
        ? `Teacher edited${task.teacherUpdatedAt ? ` on ${formatReportDate(task.teacherUpdatedAt)}` : ""}`
        : "Default bank task";

    return `
        <section class="bank-editor" id="bank-editor">
            <div class="bank-editor-head">
                <div>
                    <span class="bank-editor-kicker">Teacher Task Editor</span>
                    <h2>${escapeHtml(LESSONS[topicId]?.title || topicId)} / Level ${level}: ${escapeHtml(task.title || "Practice task")}</h2>
                    <p>${escapeHtml(modifiedText)} | ${escapeHtml(task.setTitle || task.setId || "Question set")} | ${escapeHtml(difficulty.label)} | ${difficulty.estimatedLines} code line${difficulty.estimatedLines === 1 ? "" : "s"}</p>
                </div>
                <button class="secondary-btn bank-editor-close" type="button">Close</button>
            </div>
            <div class="bank-editor-note">
                Edit the teacher-facing task fields below. Saving stores a local override in this browser and Practice will use the edited task immediately.
            </div>
            <form class="bank-editor-form" data-editor-topic="${escapeHtml(topicId)}" data-editor-task="${escapeHtml(task.id)}">
                <label>Title
                    <input class="bank-editor-input" name="title" value="${escapeHtml(snapshot.title)}">
                </label>
                <label>Objective / Student instruction
                    <textarea class="bank-editor-textarea short" name="objective">${escapeHtml(snapshot.objective)}</textarea>
                </label>
                <div class="bank-editor-grid">
                    <label>Expected variable
                        <input class="bank-editor-input" name="variable" value="${escapeHtml(snapshot.variable)}">
                    </label>
                    <label>Expected value
                        <input class="bank-editor-input" name="expected" value="${escapeHtml(snapshot.expected)}">
                    </label>
                    <label>Function hints, comma-separated
                        <input class="bank-editor-input" name="functionHints" value="${escapeHtml(snapshot.functionHints)}">
                    </label>
                </div>
                <label>Starter code
                    <textarea class="bank-editor-textarea code" name="starterCode">${escapeHtml(snapshot.starterCode)}</textarea>
                </label>
                <label>One valid solution
                    <textarea class="bank-editor-textarea code" name="solution">${escapeHtml(snapshot.solution)}</textarea>
                </label>
                <div class="bank-editor-grid two">
                    <label>Blanks JSON
                        <textarea class="bank-editor-textarea json" name="blanksJson">${escapeHtml(snapshot.blanksJson)}</textarea>
                    </label>
                    <label>Choices JSON
                        <textarea class="bank-editor-textarea json" name="choicesJson">${escapeHtml(snapshot.choicesJson)}</textarea>
                    </label>
                </div>
                <label>Debug metadata JSON
                    <textarea class="bank-editor-textarea json" name="debugJson">${escapeHtml(snapshot.debugJson)}</textarea>
                </label>
                <div class="bank-editor-feedback" id="bank-editor-feedback"></div>
                <div class="bank-editor-actions">
                    <button class="btn bank-editor-save" type="button">Save Teacher Edit</button>
                    <button class="secondary-btn bank-editor-use" type="button">${inCurrentBatch ? "Open in Practice" : "Use in Current Batch"}</button>
                    <button class="secondary-btn bank-editor-reset" type="button">Reset to Default</button>
                </div>
            </form>
        </section>
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
                <span>Level ${group.level}: ${escapeHtml(getLevelStageLabel(group.level))}</span>
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
    const difficulty = task.difficulty || getDifficultyMeta(task.setOrder || 1, level, task);
    const status = completedInBatch
        ? "Completed in current set"
        : inCurrentBatch
            ? "In current training batch"
            : "Stored in full bank";

    return `
        <button class="bank-task ${inCurrentBatch ? "current-batch" : ""} ${completedInBatch ? "completed" : ""} ${task.teacherModified ? "teacher-modified" : ""}" type="button"
            data-bank-topic="${escapeHtml(topicId)}" data-bank-task="${escapeHtml(task.id)}">
            <strong>Level ${level}: ${escapeHtml(task.title || "Practice task")}</strong>
            <span>${escapeHtml(task.setTitle || task.setId || "Question set")} | ${escapeHtml(difficulty.label)} | ${difficulty.estimatedLines} lines</span>
            <span>${escapeHtml(difficulty.complexityNote)}</span>
            <span>${escapeHtml(status)}${task.teacherModified ? " | Teacher edited" : ""}</span>
            <span>${escapeHtml(task.taskType || "practice")}</span>
        </button>
    `;
}

function openQuestionBankEditor(topicId, taskId) {
    activeBankEditorTask = { topicId, taskId };
    renderQuestionBank();
    window.setTimeout(() => {
        document.getElementById("bank-editor")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 50);
}

function closeQuestionBankEditor() {
    activeBankEditorTask = null;
    renderQuestionBank();
}

function getBankEditorForm() {
    return questionBankContent?.querySelector(".bank-editor-form") || null;
}

function setBankEditorFeedback(message, kind = "muted") {
    const feedback = document.getElementById("bank-editor-feedback");
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `bank-editor-feedback ${kind}`;
}

function collectTeacherTaskOverride(form) {
    const topicId = form.dataset.editorTopic;
    const taskId = form.dataset.editorTask;
    const task = getQuestionBankTask(topicId, taskId);
    if (!task) throw new Error("This task no longer exists in the question bank.");

    const data = new FormData(form);
    const blanks = parseTeacherJsonField(data.get("blanksJson"), task.blanks || [], "Blanks JSON");
    const choices = parseTeacherJsonField(data.get("choicesJson"), task.choices || [], "Choices JSON");
    const debug = parseTeacherJsonField(data.get("debugJson"), task.debug || null, "Debug metadata JSON");

    return {
        topicId,
        taskId,
        override: {
            title: String(data.get("title") || "").trim() || task.title,
            objective: String(data.get("objective") || "").trim() || task.objective,
            starterCode: String(data.get("starterCode") || ""),
            solution: String(data.get("solution") || "").trim() || stripTaskFixPrefix(task.solution || ""),
            variable: String(data.get("variable") || "").trim(),
            expected: String(data.get("expected") || "").trim(),
            functionHints: normalizeFunctionHints(data.get("functionHints")),
            blanks,
            choices,
            debug,
            updatedAt: new Date().toISOString()
        }
    };
}

function saveTeacherTaskEdit() {
    const form = getBankEditorForm();
    if (!form) return;

    try {
        const { topicId, taskId, override } = collectTeacherTaskOverride(form);
        const overrides = getTeacherTaskOverrides();
        overrides[getTeacherOverrideKey(topicId, taskId)] = override;
        writeTeacherTaskOverrides(overrides);
        logStudentAction("button", "Save Teacher Task Edit", {
            editedTopicId: topicId,
            editedTaskId: taskId
        });

        if (activeLessonId === topicId && activeTaskId === taskId) {
            setActiveTask(taskId, false);
        }
        renderDashboard();
        renderQuestionBank();
        setBankEditorFeedback("Saved. Practice, Dashboard, and Export Report will use this edited task.", "good");
    } catch (error) {
        setBankEditorFeedback(error.message, "error");
    }
}

function resetTeacherTaskEdit() {
    const form = getBankEditorForm();
    if (!form) return;
    const topicId = form.dataset.editorTopic;
    const taskId = form.dataset.editorTask;
    const overrides = getTeacherTaskOverrides();
    delete overrides[getTeacherOverrideKey(topicId, taskId)];
    writeTeacherTaskOverrides(overrides);
    logStudentAction("button", "Reset Teacher Task Edit", {
        editedTopicId: topicId,
        editedTaskId: taskId
    });

    if (activeLessonId === topicId && activeTaskId === taskId) {
        setActiveTask(taskId, false);
    }
    renderDashboard();
    renderQuestionBank();
    setBankEditorFeedback("Reset to the default bank task.", "muted");
}

function useBankTaskInCurrentBatch(topicId, taskId) {
    const task = getQuestionBankTask(topicId, taskId);
    if (!task) return;
    const batch = getTopicBatch(topicId);
    const bank = getQuestionBankForTopic(topicId);
    const taskMap = new Map(bank.map(item => [item.id, item]));
    const targetLevel = getTaskLevelNumber(task);
    const nextIds = (batch.taskIds?.length ? batch.taskIds : getDefaultBatchTaskIds(topicId))
        .filter(id => taskMap.has(id));
    const sameLevelIndex = nextIds.findIndex(id => getTaskLevelNumber(taskMap.get(id)) === targetLevel);
    if (sameLevelIndex >= 0) {
        nextIds[sameLevelIndex] = taskId;
    } else {
        nextIds.push(taskId);
    }
    const sortedIds = [...new Set(nextIds)]
        .sort((a, b) => getTaskLevelNumber(taskMap.get(a)) - getTaskLevelNumber(taskMap.get(b)));
    const batches = getTopicBatches();
    batches[topicId] = {
        ...batch,
        batchId: `teacher-${Date.now()}`,
        setId: "teacher-selected",
        setTitle: "Teacher selected set",
        taskIds: sortedIds,
        refreshedAt: new Date().toISOString(),
        teacherSelected: true
    };
    writeTopicBatches(batches);

    activeLearningMode = "mission";
    modeSelect.value = "mission";
    setActiveLesson(topicId, false);
    setActiveTask(taskId, false);
    setActiveView("practice");
    logStudentAction("button", "Use Bank Task In Current Batch", {
        selectedTopicId: topicId,
        selectedTaskId: taskId
    });
}

function renderPracticePatternTree(topicTrees) {
    const layout = buildPracticePatternTreeLayout(topicTrees);
    const links = layout.links.map(link => renderPracticeTreeLink(link)).join("");
    const topicNodes = layout.topics.map(node => renderPracticeTreeNode(node)).join("");

    return `
        <div class="practice-tree-panel">
            <div class="practice-tree-copy">Knowledge Map shows how practice topics connect. A topic lights up after its current Level 1-5 training batch is complete; detailed Level progress stays in Learning Tree below.</div>
            <div class="practice-tree-scroll" aria-label="Knowledge map">
                <svg class="practice-tree-svg" viewBox="0 0 ${layout.width} ${layout.height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Programming knowledge map">
                    <rect class="practice-tree-bg" x="0" y="0" width="${layout.width}" height="${layout.height}" rx="12"></rect>
                    <g class="practice-tree-links">${links}</g>
                    <g class="practice-tree-nodes">${topicNodes}</g>
                </svg>
            </div>
        </div>
    `;
}

function buildPracticePatternTreeLayout(topicTrees) {
    const width = 1000;
    const height = 400;
    const links = [];
    const topics = [];
    const topicMap = new Map(topicTrees.map(topic => [topic.topicId, topic]));
    const pointMap = new Map(KNOWLEDGE_MAP_POINTS.map(point => [point.topicId, point]));
    const nodeMap = new Map();

    topicTrees.forEach((topic, topicIndex) => {
        const point = pointMap.get(topic.topicId) || getFallbackKnowledgeMapPoint(topicIndex, width, height);
        const topicState = topic.isComplete ? "done" : topic.isActive ? "next" : "ready";
        const topicNode = {
            kind: "topic",
            x: point.x,
            y: point.y,
            w: 138,
            h: 54,
            label: topic.title,
            title: topic.title,
            state: topicState,
            topicId: topic.topicId,
            isComplete: topic.isComplete,
            isActive: topic.isActive
        };
        topics.push(topicNode);
        nodeMap.set(topic.topicId, topicNode);
    });

    KNOWLEDGE_MAP_LINKS.forEach(([sourceId, targetId]) => {
        const sourceNode = nodeMap.get(sourceId);
        const targetNode = nodeMap.get(targetId);
        if (!sourceNode || !targetNode) return;

        const sourceTopic = topicMap.get(sourceId);
        const targetTopic = topicMap.get(targetId);
        const state = sourceTopic?.isActive || targetTopic?.isActive
            ? "next"
            : sourceTopic?.isComplete && targetTopic?.isComplete
                ? "done"
                : targetTopic?.nextLevel
                    ? "ready"
                    : "locked";
        links.push({
            from: sourceNode,
            to: targetNode,
            sourceId,
            targetId,
            state
        });
    });

    return { topics, links, width, height };
}

function renderPracticeTreeLink(link) {
    const from = getKnowledgeMapEdgePoint(link.from, link.to);
    const to = getKnowledgeMapEdgePoint(link.to, link.from);
    const horizontal = Math.abs(to.x - from.x) >= Math.abs(to.y - from.y);
    const d = horizontal
        ? `M ${from.x} ${from.y} C ${from.x + (to.x - from.x) * 0.48} ${from.y}, ${to.x - (to.x - from.x) * 0.48} ${to.y}, ${to.x} ${to.y}`
        : `M ${from.x} ${from.y} C ${from.x} ${from.y + (to.y - from.y) * 0.48}, ${to.x} ${to.y - (to.y - from.y) * 0.48}, ${to.x} ${to.y}`;
    return `<path class="practice-tree-link ${escapeHtml(link.state)}" data-map-source="${escapeHtml(link.sourceId)}" data-map-target="${escapeHtml(link.targetId)}" d="${d}"></path>`;
}

function renderPracticeTreeNode(node) {
    const dataAttrs = node.kind === "topic"
        ? ` data-pattern-topic="${escapeHtml(node.topicId)}" data-map-topic="${escapeHtml(node.topicId)}"`
        : "";
    const circleLabel = node.nodeLabel || node.label;
    const labelMarkup = renderPracticeTreeNodeLabel(node, circleLabel);
    const rectX = node.x - node.w / 2;
    const rectY = node.y - node.h / 2;
    const statusLabel = node.state === "done"
        ? "Complete"
        : node.state === "next"
            ? "Current"
            : node.state === "locked"
                ? "Locked"
                : "Ready";

    return `
        <g class="practice-tree-node ${escapeHtml(node.kind)} ${escapeHtml(node.state)}"${dataAttrs}>
            <title>${escapeHtml(node.title || node.label)} - ${escapeHtml(statusLabel)}</title>
            <rect class="practice-tree-hit-area" x="${rectX - 8}" y="${rectY - 8}" width="${node.w + 16}" height="${node.h + 16}" rx="10"></rect>
            <rect class="practice-tree-node-card" x="${rectX}" y="${rectY}" width="${node.w}" height="${node.h}" rx="8"></rect>
            <circle class="practice-tree-status-dot" cx="${rectX + 14}" cy="${node.y}" r="5"></circle>
            ${labelMarkup}
        </g>
    `;
}

function renderPracticeTreeNodeLabel(node, label) {
    const lines = wrapSvgLabel(label, 16, 2);
    const lineHeight = 13;
    const firstY = node.y - ((lines.length - 1) * lineHeight) / 2 + 4;
    const spans = lines.map((line, index) => {
        const dy = index === 0 ? 0 : lineHeight;
        return `<tspan x="${node.x + 8}" dy="${dy}">${escapeHtml(line)}</tspan>`;
    }).join("");
    return `<text class="practice-tree-node-label topic-name" x="${node.x + 8}" y="${firstY}">${spans}</text>`;
}

function getKnowledgeMapEdgePoint(node, other) {
    const dx = other.x - node.x;
    const dy = other.y - node.y;
    if (Math.abs(dx) > Math.abs(dy)) {
        const x = node.x + Math.sign(dx || 1) * (node.w / 2);
        const y = node.y + clamp(dy * 0.2, -node.h / 2 + 8, node.h / 2 - 8);
        return { x, y };
    }
    const x = node.x + clamp(dx * 0.2, -node.w / 2 + 12, node.w / 2 - 12);
    const y = node.y + Math.sign(dy || 1) * (node.h / 2);
    return { x, y };
}

function getFallbackKnowledgeMapPoint(index, width, height) {
    const columns = 4;
    const x = 120 + (index % columns) * 240;
    const y = 80 + Math.floor(index / columns) * 120;
    return { x: Math.min(width - 120, x), y: Math.min(height - 70, y) };
}

function setKnowledgeMapHover(topicId) {
    const svg = dashboardSkillCloud?.querySelector(".practice-tree-svg");
    if (!svg || !topicId) return;

    const relatedTopics = new Set([topicId]);
    svg.querySelectorAll(".practice-tree-link").forEach(link => {
        const sourceId = link.dataset.mapSource;
        const targetId = link.dataset.mapTarget;
        const isRelated = sourceId === topicId || targetId === topicId;
        link.classList.toggle("is-focused", isRelated);
        link.classList.toggle("is-muted", !isRelated);
        if (isRelated) {
            if (sourceId) relatedTopics.add(sourceId);
            if (targetId) relatedTopics.add(targetId);
        }
    });

    svg.querySelectorAll(".practice-tree-node.topic").forEach(node => {
        const nodeTopicId = node.dataset.mapTopic;
        const isHovered = nodeTopicId === topicId;
        const isNeighbor = relatedTopics.has(nodeTopicId);
        node.classList.toggle("is-hovered", isHovered);
        node.classList.toggle("is-neighbor", !isHovered && isNeighbor);
        node.classList.toggle("is-muted", !isNeighbor);
    });
    svg.classList.add("is-focusing");
}

function clearKnowledgeMapHover() {
    const svg = dashboardSkillCloud?.querySelector(".practice-tree-svg");
    if (!svg) return;

    svg.classList.remove("is-focusing");
    svg.querySelectorAll(".is-hovered, .is-neighbor, .is-muted, .is-focused").forEach(element => {
        element.classList.remove("is-hovered", "is-neighbor", "is-muted", "is-focused");
    });
}

function wrapSvgLabel(label, maxChars = 10, maxLines = 3) {
    const words = String(label || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";

    words.forEach(word => {
        if (!current) {
            current = word;
            return;
        }
        if (`${current} ${word}`.length <= maxChars) {
            current = `${current} ${word}`;
        } else {
            lines.push(current);
            current = word;
        }
    });
    if (current) lines.push(current);

    const compactLines = lines.flatMap(line => {
        if (line.length <= maxChars + 2) return [line];
        const chunks = [];
        for (let index = 0; index < line.length; index += maxChars) {
            chunks.push(line.slice(index, index + maxChars));
        }
        return chunks;
    });

    if (compactLines.length <= maxLines) return compactLines;
    const visible = compactLines.slice(0, maxLines);
    visible[maxLines - 1] = truncateLabel(visible[maxLines - 1], maxChars);
    return visible;
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
                stage: getLevelStageLabel(levelNumber),
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
    const idMatch = String(task?.id || "").match(/-l(\d+)(?:-|$)/i);
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
    if (isLevelZeroTask(task)) return renderLevelZeroChoiceGate(task);

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

function getLevelZeroCriterionByToken(result, token) {
    return (result?.criteria || []).find(item => item.type === "blankChoice" && item.token === token) || null;
}

function renderLevelZeroChoiceGate(task) {
    const attemptKey = getLevelZeroAttemptKey(activeLessonId, task);
    const attempts = levelZeroAttemptCounts[attemptKey] || 0;
    const answersRevealed = revealedLevelZeroAnswers.has(attemptKey);
    const usedValues = new Set(task.blanks.map(blank => normalizeCodeChoice(getBlankValue(blank.token))).filter(Boolean));
    const choiceButtons = (task.choices || []).map(choice => {
        const used = usedValues.has(normalizeCodeChoice(choice.code));
        return `
            <button class="choice-chip ${used ? "used" : ""}" type="button"
                draggable="${used ? "false" : "true"}"
                data-choice-code="${escapeHtml(choice.code)}"
                ${used ? "disabled" : ""}>
                <code>${escapeHtml(choice.code)}</code>
            </button>
        `;
    }).join("");

    const blankRows = task.blanks.map(blank => {
        const value = getBlankValue(blank.token);
        const criterion = getLevelZeroCriterionByToken(lastLessonResult, blank.token);
        const revealedCorrect = answersRevealed && normalizeCodeChoice(value) === normalizeCodeChoice(blank.answer);
        const statusClass = revealedCorrect ? "correct" : criterion ? (criterion.passed ? "correct" : "wrong") : value ? "filled" : "empty";
        const statusText = revealedCorrect ? "Answer shown" : criterion ? (criterion.passed ? "Green light" : "Red light") : value ? "selected" : "drop here";
        const explanation = revealedCorrect
            ? `<div class="choice-slot-feedback good">${escapeHtml(blank.explanation || "This block fits the blank.")}</div>`
            : criterion && !criterion.passed
            ? `<div class="choice-slot-feedback">${escapeHtml(criterion.fix || blank.hint || "Choose a different block and run again.")}</div>`
            : criterion?.passed
                ? `<div class="choice-slot-feedback good">${escapeHtml(blank.explanation || "This block fits the blank.")}</div>`
                : "";
        return `
            <div class="choice-slot-row ${statusClass}">
                <div class="choice-slot-meta">
                    <strong>${escapeHtml(blank.token)}</strong>
                    <span>${escapeHtml(blank.label)}</span>
                </div>
                <div class="choice-drop-zone" data-blank-token="${escapeHtml(blank.token)}">
                    <code>${value ? escapeHtml(value) : "Drop code block here"}</code>
                </div>
                <button class="mini-fix-button choice-clear-button" type="button" data-blank-token="${escapeHtml(blank.token)}" ${value ? "" : "disabled"}>Clear</button>
                <span class="choice-status">${escapeHtml(statusText)}</span>
                ${explanation}
            </div>
        `;
    }).join("");

    const answerPanel = answersRevealed
        ? `<div class="level-zero-answer-panel">
            <strong>Answer shown after 3 attempts</strong>
            ${task.blanks.map(blank => `
                <div><code>${escapeHtml(blank.token)}</code> = <code>${escapeHtml(blank.answer)}</code><span>${escapeHtml(blank.explanation)}</span></div>
            `).join("")}
        </div>`
        : "";

    return `
        <div class="blank-panel level-zero-panel" id="blank-panel">
            <div class="blank-title">Level 0 Code Block Gate</div>
            <div class="blank-help">Use the labels beside each blank to choose the right block. Drag a block into a blank, or click a block to place it in the next empty blank. Wrong choices turn red after Compile & Run. Attempts: ${attempts}/3.</div>
            <div class="choice-workspace">
                <div class="choice-slots">${blankRows}</div>
                <div class="choice-bank" aria-label="Code block choices">
                    <div class="choice-bank-title">Code blocks</div>
                    <div class="choice-chip-grid">${choiceButtons}</div>
                </div>
            </div>
            ${answerPanel}
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

function handleLevelZeroAttemptResult(task, result) {
    if (!isLevelZeroTask(task)) return;

    const key = getLevelZeroAttemptKey(activeLessonId, task);
    if (result?.passed) {
        levelZeroAttemptCounts[key] = 0;
        revealedLevelZeroAnswers.delete(key);
        return;
    }

    const nextCount = Math.min(3, (levelZeroAttemptCounts[key] || 0) + 1);
    levelZeroAttemptCounts[key] = nextCount;

    if (nextCount >= 3) {
        revealedLevelZeroAnswers.add(key);
        logStudentAction("button", "Level 0 Answer Revealed", {
            attemptsUsed: nextCount
        });
        task.blanks.forEach(blank => {
            blankDraftValues[blank.token] = blank.answer;
        });
        codeInput.value = renderCodeWithBlankValues(task);
        syncEditorRendering();
        renderBlankSlot(task);
        consoleOutput.innerHTML += `<div class="console-row trace-output-label">LEVEL 0 ANSWER</div><div class="console-row trace-explanation">Three attempts were used. The correct code blocks have been filled into Code. Read the explanations in the Level 0 gate, then click Compile & Run once more to verify the trace.</div>`;
    }
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
    localStorage.removeItem(REVIEW_LAB_RECORDS_KEY);
    localStorage.removeItem(REVIEW_LAB_PROGRESS_KEY);
    localStorage.removeItem(REVIEW_LAB_DRAFTS_KEY);
    localStorage.removeItem(REVIEW_LAB_ACTIVE_KEY);
    if (typeof resetQualityStudioProgress === "function") resetQualityStudioProgress();
    predictionAttempts = [];
    exerciseTrainingRecords = [];
    studentActionLog = [];
    activeReviewLabTaskId = REVIEW_LAB_TASKS[0].id;
    reviewLabLoadedTaskId = null;
    reviewLabLastResult = null;
    reviewLabSessionMessage = "";
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
    renderReviewLab();
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
btnReviewLabView?.addEventListener('click', () => setActiveView("review"));
btnQualityStudioView?.addEventListener('click', () => setActiveView("quality"));
btnDashboardView?.addEventListener('click', () => setActiveView("dashboard"));
btnQuestionBankView?.addEventListener('click', () => setActiveView("bank"));
reviewTaskSelect?.addEventListener('change', () => setActiveReviewLabTask(reviewTaskSelect.value));
btnReviewPause?.addEventListener('click', pauseReviewLab);
btnReviewLastAttempt?.addEventListener('click', reviewLastLabAttempt);
btnReviewRetry?.addEventListener('click', startNewReviewLabAttempt);
btnReviewNext?.addEventListener('click', openNextReviewLabTask);
btnReviewRestore?.addEventListener('click', () => {
    const task = getReviewLabTask();
    reviewAiCode.value = task.aiCode;
    reviewReason.value = "";
    reviewLabLastResult = null;
    reviewLabSessionMessage = "Original AI-generated code restored. Issue and test choices were kept.";
    saveReviewLabDraft();
    renderReviewLabResult(null);
});
btnReviewEvaluate?.addEventListener('click', evaluateReviewLab);
reviewAiCode?.addEventListener('input', scheduleReviewLabDraftSave);
reviewReason?.addEventListener('input', scheduleReviewLabDraftSave);
reviewIssueList?.addEventListener('change', scheduleReviewLabDraftSave);
reviewTestList?.addEventListener('change', scheduleReviewLabDraftSave);
reviewHistory?.addEventListener('click', event => {
    const button = event.target.closest('[data-review-record-index]');
    if (!button) return;
    loadReviewLabAttempt(button.dataset.reviewRecordIndex);
});

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
        const wasRevealed = revealedMissionFixes.has(index);
        if (wasRevealed) {
            revealedMissionFixes.delete(index);
        } else {
            revealedMissionFixes.add(index);
        }
        logStudentAction("button", wasRevealed ? "Hide Fix" : "Show Fix", {
            criterionIndex: index
        });
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

function applyLevelZeroChoice(token, code) {
    if (!token || code === undefined) return;
    blankDraftValues[token] = code;
    logStudentAction("choice", "Level 0 Choice", {
        blankToken: token,
        selectedCode: code
    });
    clearWalkthroughState();
    revealedMissionFixes = new Set();
    codeInput.value = renderCodeWithBlankValues();
    resetTimelineState();
    renderLessonGoal();
    updateRunAvailability();
}

function applyChoiceToNextEmptyBlank(code) {
    const task = getActiveTask();
    if (!isLevelZeroTask(task)) return;
    const nextBlank = task.blanks.find(blank => !getBlankValue(blank.token).trim());
    if (!nextBlank) return;
    applyLevelZeroChoice(nextBlank.token, code);
}

function clearLevelZeroChoice(token) {
    if (!token) return;
    delete blankDraftValues[token];
    clearWalkthroughState();
    revealedMissionFixes = new Set();
    codeInput.value = renderCodeWithBlankValues();
    resetTimelineState();
    renderLessonGoal();
    updateRunAvailability();
}

blankSlot?.addEventListener('click', (event) => {
    const choiceButton = event.target.closest(".choice-chip");
    if (choiceButton && !choiceButton.disabled) {
        applyChoiceToNextEmptyBlank(choiceButton.dataset.choiceCode);
        return;
    }

    const clearButton = event.target.closest(".choice-clear-button");
    if (clearButton) {
        clearLevelZeroChoice(clearButton.dataset.blankToken);
    }
});

blankSlot?.addEventListener('dragstart', (event) => {
    const choiceButton = event.target.closest(".choice-chip");
    if (!choiceButton || choiceButton.disabled) return;
    event.dataTransfer.setData("text/plain", choiceButton.dataset.choiceCode || "");
    event.dataTransfer.effectAllowed = "copy";
});

blankSlot?.addEventListener('dragover', (event) => {
    if (!event.target.closest(".choice-drop-zone")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
});

blankSlot?.addEventListener('drop', (event) => {
    const dropZone = event.target.closest(".choice-drop-zone");
    if (!dropZone) return;
    event.preventDefault();
    const code = event.dataTransfer.getData("text/plain");
    applyLevelZeroChoice(dropZone.dataset.blankToken, code);
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
    if (event.target.closest(".bank-editor-close")) {
        closeQuestionBankEditor();
        return;
    }

    if (event.target.closest(".bank-editor-save")) {
        saveTeacherTaskEdit();
        return;
    }

    if (event.target.closest(".bank-editor-reset")) {
        resetTeacherTaskEdit();
        return;
    }

    if (event.target.closest(".bank-editor-use")) {
        const form = getBankEditorForm();
        if (form) {
            useBankTaskInCurrentBatch(form.dataset.editorTopic, form.dataset.editorTask);
        }
        return;
    }

    const refreshButton = event.target.closest(".bank-refresh-topic");
    if (refreshButton) {
        refreshTopicPracticeBatch(refreshButton.dataset.bankRefreshTopic);
        return;
    }

    const taskButton = event.target.closest(".bank-task");
    if (taskButton) {
        openQuestionBankEditor(taskButton.dataset.bankTopic, taskButton.dataset.bankTask);
    }
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
            handleLevelZeroAttemptResult(task, lastLessonResult);
        }
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
    const topicNode = event.target.closest(".practice-tree-node.topic");
    if (!topicNode) return;
    const topicId = topicNode.dataset.patternTopic;
    if (!topicId || !LESSONS[topicId]) return;
    activeLearningMode = "mission";
    modeSelect.value = "mission";
    setActiveLesson(topicId);
    setActiveView("practice");
});
dashboardSkillCloud?.addEventListener('mouseover', (event) => {
    const topicNode = event.target.closest(".practice-tree-node.topic");
    if (!topicNode || !dashboardSkillCloud.contains(topicNode)) return;
    setKnowledgeMapHover(topicNode.dataset.patternTopic);
});
dashboardSkillCloud?.addEventListener('mouseleave', clearKnowledgeMapHover);
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
        if (check.type === "blankChoice") {
            const selected = normalizeCodeChoice(getBlankValue(check.token));
            const expected = normalizeCodeChoice(check.expected);
            const passed = selected === expected;
            const selectedText = getBlankValue(check.token).trim() || "empty";
            return {
                type: check.type,
                token: check.token,
                expected: check.expected,
                actual: selectedText,
                passed,
                label: passed
                    ? `${check.token} uses the correct code block: ${check.expected}.`
                    : `${check.token} should use ${check.expected}. Selected: ${selectedText}.`,
                fix: passed
                    ? check.explanation || "This selected block matches the blank."
                    : `${check.token} should be ${check.expected}.\nWhy: ${check.explanation || check.hint || "This block is the one that makes the surrounding code match the task goal."}\nHint: ${check.hint || "Replace the selected block and run again."}`
            };
        }

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

const REPORT_LEVEL_ABILITIES = {
    0: {
        title: "Code-block recognition",
        short: "L0 Recognition",
        evidence: "Chooses correct code blocks from distractors and places them in the right blanks."
    },
    1: {
        title: "Key expression understanding",
        short: "L1 Expression",
        evidence: "Completes the critical variable, condition, index, or accumulator expression."
    },
    2: {
        title: "Single-line construction",
        short: "L2 One line",
        evidence: "Writes one complete Python line that fits the surrounding program."
    },
    3: {
        title: "Complete program construction",
        short: "L3 Program",
        evidence: "Builds the full logic needed to make the target variable correct."
    },
    4: {
        title: "Code quality and refinement",
        short: "L4 Refactor",
        evidence: "Replaces repeated or noisy code with the intended algorithmic pattern."
    },
    5: {
        title: "Debugging and diagnosis",
        short: "L5 Debug",
        evidence: "Repairs broken code and explains the state problem with trace evidence."
    }
};

const REPORT_STATUS_META = {
    independent: { label: "Independent", className: "independent", rank: 5 },
    developing: { label: "Developing", className: "developing", rank: 4 },
    supported: { label: "With help", className: "supported", rank: 3 },
    historical: { label: "Completed", className: "historical", rank: 3 },
    needsSupport: { label: "Needs support", className: "needs-support", rank: 2 },
    notStarted: { label: "Not started", className: "not-started", rank: 1 },
    locked: { label: "Locked", className: "locked", rank: 0 }
};

function buildLearningReportData(scope = { type: "all", label: "All Practice Topics" }) {
    const topicFilter = scope.type === "topic" ? scope.topicId : null;
    const completed = getCompletedMissions();
    const records = topicFilter
        ? exerciseTrainingRecords.filter(item => item.topicId === topicFilter)
        : exerciseTrainingRecords;
    const predictions = topicFilter
        ? predictionAttempts.filter(item => item.topicId === topicFilter)
        : predictionAttempts;
    const actions = topicFilter
        ? studentActionLog.filter(item => item.topicId === topicFilter)
        : studentActionLog;
    const reportContext = { records, predictions, actions };
    const topics = STUDENT_TOPIC_ORDER
        .filter(topicId => LESSONS[topicId])
        .filter(topicId => !topicFilter || topicId === topicFilter)
        .map(topicId => buildTopicReportRow(topicId, completed, reportContext));
    const abilities = buildAbilityMasteryRows(topics);
    const currentResult = (!topicFilter || topicFilter === activeLessonId) ? lastLessonResult : null;
    const signals = buildReportSignals(records, predictions, currentResult);
    const recommendations = buildReportRecommendations({ topics, abilities, signals, records, predictions });
    const recentExercises = records.slice(-8).reverse().map(buildRecentExerciseRow);
    const totalLevels = topics.reduce((sum, topic) => sum + topic.totalCount, 0);
    const completedLevels = topics.reduce((sum, topic) => sum + topic.completedCount, 0);
    const independentLevels = topics.flatMap(topic => topic.levels).filter(level => level.statusKey === "independent").length;
    const supportLevels = topics.flatMap(topic => topic.levels).filter(level => ["needsSupport", "supported"].includes(level.statusKey)).length;
    const runCount = records.length;
    const passedRuns = records.filter(item => item.goalPassed).length;
    const predictionTotal = predictions.length;
    const predictionCorrect = predictions.filter(item => item.correct).length;
    const nextFocus = topics.find(topic => topic.nextMission) || null;
    const exportedAt = new Date();
    const reviewLab = topicFilter ? null : buildReviewLabReportData();
    const qualityStudio = topicFilter || typeof buildQualityStudioReportData !== "function"
        ? null
        : buildQualityStudioReportData();

    return {
        exportedAt,
        exportedAtLabel: formatReportDate(exportedAt),
        fileDate: exportedAt.toISOString().slice(0, 10),
        summary: {
            completedLevels,
            totalLevels,
            independentLevels,
            supportLevels,
            overallPercent: totalLevels ? Math.round((completedLevels / totalLevels) * 100) : 0,
            runCount,
            passedRuns,
            runSuccessRate: runCount ? Math.round((passedRuns / runCount) * 100) : 0,
            predictionTotal,
            predictionCorrect,
            predictionRate: predictionTotal ? Math.round((predictionCorrect / predictionTotal) * 100) : 0,
            helpEvents: actions.filter(isReportHelpAction).length,
            nextFocusLabel: nextFocus?.nextLevel || "All available levels complete",
            nextFocusTopic: nextFocus?.title || ""
        },
        narrative: buildReportNarrative(topics, abilities, signals, { records, predictions }),
        topics,
        abilities,
        recentExercises,
        signals,
        recommendations,
        reviewLab,
        qualityStudio,
        scope: {
            ...scope,
            isTopicReport: Boolean(topicFilter)
        }
    };
}

function buildReviewLabReportData() {
    const records = getReviewLabRecords();
    const completed = getReviewLabProgress();
    const drafts = getReviewLabDrafts();
    const tasks = REVIEW_LAB_TASKS.map(task => {
        const attempts = records.filter(record => record.taskId === task.id);
        const latest = attempts[attempts.length - 1] || null;
        const passedAttempt = [...attempts].reverse().find(record => record.passed) || null;
        const evidence = passedAttempt || latest;
        return {
            title: task.title,
            category: task.category,
            attempts: attempts.length,
            status: completed.has(task.id) ? "Demonstrated" : attempts.length ? "Needs revision" : drafts[task.id] ? "In progress" : "Not observed",
            diagnosis: evidence?.issuePassed ? "Demonstrated" : "Not yet",
            tests: evidence?.testDesignPassed ? "Demonstrated" : "Not yet",
            repair: evidence?.runtimePassed && evidence?.sourcePassed ? "Demonstrated" : "Not yet",
            reasoning: evidence?.reasonPassed ? "Demonstrated" : "Not yet"
        };
    });

    return {
        completed: completed.size,
        total: REVIEW_LAB_TASKS.length,
        attempts: records.length,
        drafts: Object.keys(drafts).filter(taskId => REVIEW_LAB_TASKS.some(task => task.id === taskId)).length,
        tasks
    };
}

function buildTopicReportRow(topicId, completed = getCompletedMissions(), context = {}) {
    const progress = getTopicProgress(topicId);
    const title = LESSONS[topicId]?.title || topicId;
    const levels = progress.path.map((mission, index) => buildLevelMasteryRow({
        mission,
        index,
        completed,
        progress,
        context
    }));
    const completedCount = levels.filter(level => level.isCompleted).length;
    const nextMission = progress.nextMission;

    return {
        topicId,
        title,
        levels,
        completedCount,
        totalCount: levels.length,
        percent: levels.length ? Math.round((completedCount / levels.length) * 100) : 0,
        nextMission,
        nextLevel: nextMission ? `Level ${nextMission.level}: ${nextMission.stage}` : "Complete",
        statusKey: getTopicMasteryStatus(levels)
    };
}

function buildLevelMasteryRow({ mission, index, completed, progress, context }) {
    const task = getTaskForReport(mission.topicId, mission.taskId);
    const records = (context.records || []).filter(item => item.topicId === mission.topicId && item.taskId === mission.taskId);
    const actions = (context.actions || []).filter(item => item.topicId === mission.topicId && item.taskId === mission.taskId);
    const predictions = (context.predictions || []).filter(item => item.topicId === mission.topicId && item.taskId === mission.taskId);
    const failedCriteria = records.flatMap(record =>
        (record.criteria || [])
            .filter(check => !check.passed)
            .map(check => ({ check, record }))
    );
    const helpEvents = actions.filter(isReportHelpAction);
    const isCompleted = isMissionCompleted(mission, completed);
    const isNext = progress.nextMission?.taskId === mission.taskId;
    const locked = !isCompleted && !isNext && !isMissionLevelAccessible(index, completed, progress.path);
    const passIndex = records.findIndex(record => record.goalPassed);
    const attemptsToPass = passIndex >= 0 ? passIndex + 1 : null;
    const statusKey = classifyLevelMastery({
        isCompleted,
        attempts: records.length,
        attemptsToPass,
        helpCount: helpEvents.length,
        locked
    });
    const ability = REPORT_LEVEL_ABILITIES[mission.level] || {
        title: `Level ${mission.level}`,
        short: `L${mission.level}`,
        evidence: mission.stage
    };

    return {
        level: mission.level,
        stage: mission.stage,
        ability,
        taskTitle: task?.title || "Practice task",
        taskType: task?.taskType || "",
        isCompleted,
        isNext,
        locked,
        statusKey,
        statusLabel: getReportStatusMeta(statusKey).label,
        attempts: records.length,
        attemptsToPass,
        passedAttempts: records.filter(record => record.goalPassed).length,
        helpCount: helpEvents.length,
        predictionTotal: predictions.length,
        predictionCorrect: predictions.filter(item => item.correct).length,
        topGap: summarizeFailedCriteria(failedCriteria),
        evidence: buildLevelEvidenceText({ records, isCompleted, locked, helpEvents, failedCriteria, predictions, attemptsToPass })
    };
}

function classifyLevelMastery({ isCompleted, attempts, attemptsToPass, helpCount, locked }) {
    if (isCompleted) {
        if (!attempts) return "historical";
        if (!attemptsToPass) return helpCount ? "supported" : "historical";
        if (helpCount || attemptsToPass > 3) return "supported";
        if (attemptsToPass <= 1) return "independent";
        return "developing";
    }
    if (attempts > 0) return "needsSupport";
    return locked ? "locked" : "notStarted";
}

function getTopicMasteryStatus(levels) {
    if (levels.some(level => level.statusKey === "needsSupport")) return "needsSupport";
    if (levels.some(level => level.statusKey === "supported")) return "supported";
    if (levels.some(level => level.statusKey === "developing")) return "developing";
    if (levels.length && levels.every(level => ["independent", "historical"].includes(level.statusKey))) return "independent";
    if (levels.some(level => ["independent", "historical"].includes(level.statusKey))) return "developing";
    return "notStarted";
}

function buildLevelEvidenceText({ records, isCompleted, locked, helpEvents, failedCriteria, predictions, attemptsToPass }) {
    if (isCompleted && !records.length) {
        return "Completed in stored progress; no current-session attempt details were available.";
    }
    if (isCompleted) {
        const helpText = helpEvents.length ? ` with ${helpEvents.length} help event${helpEvents.length === 1 ? "" : "s"}` : " without recorded help";
        const predictionText = predictions.length ? ` Prediction checks: ${predictions.filter(item => item.correct).length}/${predictions.length}.` : "";
        return `Passed in ${attemptsToPass || records.length} attempt${(attemptsToPass || records.length) === 1 ? "" : "s"}${helpText}.${predictionText}`;
    }
    if (records.length) {
        const gap = summarizeFailedCriteria(failedCriteria);
        return `${records.length} attempt${records.length === 1 ? "" : "s"} so far; current gap: ${gap || "the trace does not yet prove the goal"}.`;
    }
    if (locked) return "Locked because earlier levels in this topic are not complete yet.";
    return "Ready to start; no attempt evidence recorded yet.";
}

function isReportHelpAction(action) {
    return /Show Fix|Reveal|Walkthrough|Answer Revealed/i.test(action?.label || "");
}

function getReportStatusMeta(statusKey) {
    return REPORT_STATUS_META[statusKey] || REPORT_STATUS_META.notStarted;
}

function summarizeFailedCriteria(failedItems) {
    if (!failedItems?.length) return "";
    const counts = failedItems.reduce((map, item) => {
        const category = categorizeReportCheck(item.check).label;
        map.set(category, (map.get(category) || 0) + 1);
        return map;
    }, new Map());
    const [label] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    const sample = failedItems[failedItems.length - 1]?.check?.label || "";
    return sample ? `${label}: ${sample}` : label;
}

function categorizeReportCheck(check = {}) {
    if (check.type === "blankChoice") {
        return {
            label: "Code-block choice",
            diagnostic: "The student selected a block that does not fit the blank's role.",
            level: "Review"
        };
    }
    if (check.type === "noErrors") {
        return {
            label: "Executable code",
            diagnostic: "The code still stops before the final state can be trusted.",
            level: "Fix first"
        };
    }
    if (check.type === "variableEquals") {
        return {
            label: "Final state model",
            diagnostic: "The target variable finishes with the wrong or missing value.",
            level: "Review"
        };
    }
    if (check.type === "conceptSeen") {
        return {
            label: `${check.concept || "Process"} evidence`,
            diagnostic: "The final answer may not show the intended programming process.",
            level: "Practice"
        };
    }
    if (check.type === "antiShortcut") {
        return {
            label: "Hard-coded answer",
            diagnostic: "The code appears to assign the final answer directly instead of producing it through logic.",
            level: "Review"
        };
    }
    if (check.type === "codeRegex" || check.type === "maxNonEmptyLines") {
        return {
            label: "Code quality",
            diagnostic: "The code works toward the answer but still misses the requested structure or refinement.",
            level: "Refine"
        };
    }
    if (check.type === "stdoutContains") {
        return {
            label: "Output evidence",
            diagnostic: "The internal value may exist, but the required visible output is missing.",
            level: "Check"
        };
    }
    return {
        label: "General goal evidence",
        diagnostic: "The trace does not yet provide enough evidence for the task goal.",
        level: "Review"
    };
}

function buildAbilityMasteryRows(topics) {
    return Object.entries(REPORT_LEVEL_ABILITIES).map(([levelText, ability]) => {
        const levelNumber = Number(levelText);
        const levels = topics.flatMap(topic => topic.levels.filter(level => level.level === levelNumber));
        const counts = levels.reduce((map, level) => {
            map[level.statusKey] = (map[level.statusKey] || 0) + 1;
            return map;
        }, {});
        const completed = levels.filter(level => level.isCompleted).length;
        const attempted = levels.filter(level => level.attempts > 0).length;
        const statusKey = getAbilityStatusKey(levels);
        const gapExamples = levels
            .filter(level => level.statusKey === "needsSupport" || level.topGap)
            .map(level => `${level.taskTitle}: ${level.topGap || level.evidence}`)
            .slice(0, 2);

        return {
            level: levelNumber,
            ...ability,
            statusKey,
            statusLabel: getReportStatusMeta(statusKey).label,
            completed,
            total: levels.length,
            attempted,
            counts,
            evidence: `${completed}/${levels.length || 0} completed; ${attempted} attempted in this session.`,
            nextCheck: gapExamples.length
                ? gapExamples.join(" ")
                : ability.evidence
        };
    });
}

function getAbilityStatusKey(levels) {
    if (!levels.length) return "notStarted";
    if (levels.some(level => level.statusKey === "needsSupport")) return "needsSupport";
    if (levels.some(level => level.statusKey === "supported")) return "supported";
    if (levels.some(level => level.statusKey === "developing")) return "developing";
    if (levels.some(level => level.statusKey === "independent")) return "independent";
    if (levels.some(level => level.statusKey === "historical")) return "historical";
    return levels.some(level => level.statusKey === "notStarted") ? "notStarted" : "locked";
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

    const grouped = new Map();
    failedChecks.forEach(item => {
        const category = categorizeReportCheck(item.check);
        const existing = grouped.get(category.label) || {
            label: category.label,
            level: category.level,
            count: 0,
            detail: category.diagnostic,
            evidence: []
        };
        existing.count += 1;
        existing.evidence.push(item.check.label || item.check.fix || "");
        grouped.set(category.label, existing);
    });

    const signals = [...grouped.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(item => ({
            label: item.label,
            level: item.level,
            detail: `${item.count} signal${item.count === 1 ? "" : "s"}. ${item.detail} ${item.evidence.filter(Boolean).slice(-1)[0] || ""}`.trim()
        }));

    const wrongPredictions = predictions.filter(item => !item.correct);
    if (wrongPredictions.length) {
        const variables = [...new Set(wrongPredictions.map(item => item.variable).filter(Boolean))].slice(0, 3).join(", ");
        signals.unshift({
            label: "Trace prediction",
            level: "Review",
            detail: `${wrongPredictions.length} incorrect prediction attempt${wrongPredictions.length === 1 ? "" : "s"}${variables ? ` around ${variables}` : ""}. This suggests the student should pause on variable changes and predict the next state.`
        });
    }

    if (!signals.length) {
        return [{
            label: "No major gap yet",
            level: "Stable",
            detail: "No strong misconception signal has been recorded in this browser session. More attempts will make the diagnosis more precise."
        }];
    }

    return signals.slice(0, 6);
}

function buildReportRecommendations(context) {
    const recommendations = [];
    const nextTopic = context.topics.find(topic => topic.nextMission);
    const weakAbility = context.abilities.find(ability => ability.statusKey === "needsSupport")
        || context.abilities.find(ability => ability.statusKey === "supported")
        || context.abilities.find(ability => ability.statusKey === "developing");
    const hasRuntimeGap = context.signals.some(item => /Executable code/i.test(item.label));
    const hasShortcutGap = context.signals.some(item => /Hard-coded|Process evidence/i.test(item.label + item.detail));
    const hasPredictionGap = context.signals.some(item => /Trace prediction/i.test(item.label));
    const hasCodeChoiceGap = context.signals.some(item => /Code-block choice/i.test(item.label));

    if (hasRuntimeGap) {
        recommendations.push("First stabilize syntax and runtime errors. A teacher should ask the student to identify the exact line where execution stops before discussing algorithm quality.");
    }
    if (hasCodeChoiceGap) {
        recommendations.push("Return to Level 0 for the same topic and ask the student to explain why each selected block fits its blank before running.");
    }
    if (hasPredictionGap) {
        recommendations.push("Use the timeline as a prediction drill: pause before each variable change and ask what the next value should be.");
    }
    if (hasShortcutGap) {
        recommendations.push("Ask for process evidence, not only the final value. The student should point to the line that creates the target value through the intended pattern.");
    }
    if (weakAbility) {
        recommendations.push(`Target the weakest ability next: ${weakAbility.title}. ${weakAbility.nextCheck}`);
    }
    if (nextTopic) {
        recommendations.push(`Next practice item: ${nextTopic.title}, ${nextTopic.nextLevel}.`);
    }
    if (!recommendations.length) {
        recommendations.push("Continue to the next unlocked level and keep asking the student to explain the trace evidence behind each successful run.");
    }

    return recommendations.slice(0, 5);
}

function buildReportNarrative(topics, abilities, signals, context) {
    const completed = topics.reduce((sum, topic) => sum + topic.completedCount, 0);
    const total = topics.reduce((sum, topic) => sum + topic.totalCount, 0);
    const weakest = abilities.find(ability => ability.statusKey === "needsSupport")
        || abilities.find(ability => ability.statusKey === "supported")
        || abilities.find(ability => ability.statusKey === "developing");
    const strongest = abilities.find(ability => ability.statusKey === "independent")
        || abilities.find(ability => ability.statusKey === "historical");
    const firstSignal = signals[0];
    const predictionRate = context.predictions.length
        ? `${context.predictions.filter(item => item.correct).length}/${context.predictions.length}`
        : "not enough data";

    return {
        headline: total
            ? `The student has completed ${completed}/${total} current training levels.`
            : "No current training levels were found for this report scope.",
        mastery: weakest
            ? `Most useful next focus: ${weakest.title}. ${weakest.evidence}`
            : "No weak ability has been detected yet.",
        strength: strongest
            ? `Current strength signal: ${strongest.title}.`
            : "The report needs more successful attempts before naming a stable strength.",
        trace: `Trace prediction evidence: ${predictionRate}.`,
        risk: firstSignal ? `${firstSignal.label}: ${firstSignal.detail}` : "No major risk signal yet."
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
    const topGap = summarizeFailedCriteria(failed.map(check => ({ check, record: item })));
    return {
        time: formatReportDate(item.timestamp),
        topicTitle: item.topicTitle || LESSONS[item.topicId]?.title || item.topicId,
        taskTitle: item.taskTitle || "Practice task",
        levelLabel: level ? `Level ${level.level}` : "Practice",
        result: item.goalPassed ? "Passed" : "Needs work",
        traceSteps: item.traceSteps,
        evidence: item.goalPassed
            ? "Goal met with trace evidence."
            : topGap || "The current trace does not yet prove the goal."
    };
}

function renderLearningReportHtml(report, options = {}) {
    const autoPrint = Boolean(options.autoPrint);
    const title = report.scope?.isTopicReport
        ? `${report.scope.label} Mastery Report`
        : "Student Programming Mastery Report";
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; background: #eef2f1; color: #1d2924; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.45; }
        .report { width: min(1040px, calc(100% - 32px)); margin: 24px auto; background: #ffffff; border: 1px solid #dbe5df; border-radius: 8px; overflow: hidden; box-shadow: 0 18px 48px rgba(21, 31, 26, 0.1); }
        .hero { padding: 28px 32px; background: #17211e; color: #ffffff; display: grid; gap: 8px; }
        .hero h1 { margin: 0; font-size: 28px; letter-spacing: 0; }
        .hero p { margin: 0; color: #c9d8d0; font-size: 14px; }
        .section { padding: 22px 32px; border-bottom: 1px solid #e4ebe7; }
        .section:last-child { border-bottom: 0; }
        .section h2 { margin: 0 0 12px; font-size: 16px; color: #17211e; }
        .summary-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 14px; align-items: stretch; }
        .narrative { display: grid; gap: 8px; border: 1px solid #dbe5df; border-radius: 8px; padding: 14px; background: #fbfcfb; }
        .narrative p { margin: 0; color: #32413a; font-size: 13px; }
        .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .stat { border: 1px solid #dbe5df; border-radius: 8px; padding: 12px; background: #fbfcfb; }
        .stat strong { display: block; font-size: 21px; color: #0f5132; }
        .stat span { color: #60736a; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; color: #60736a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #dbe5df; padding: 8px 7px; }
        td { border-bottom: 1px solid #edf2ef; padding: 8px 7px; vertical-align: top; }
        tr:last-child td { border-bottom: 0; }
        .matrix-cell { display: grid; gap: 4px; min-width: 116px; }
        .status-pill { display: inline-flex; width: fit-content; max-width: 100%; padding: 4px 8px; border-radius: 999px; border: 1px solid #cfd9d4; color: #60736a; font-weight: 800; font-size: 11px; line-height: 1.2; }
        .status-pill.independent { background: #def7e8; border-color: #63b37d; color: #14532d; }
        .status-pill.developing { background: #e0f2fe; border-color: #60a5fa; color: #1e3a8a; }
        .status-pill.supported { background: #fff7df; border-color: #e5b84a; color: #7a5410; }
        .status-pill.historical { background: #eef2ff; border-color: #9aa7ff; color: #3730a3; }
        .status-pill.needs-support { background: #fee2e2; border-color: #f87171; color: #7f1d1d; }
        .status-pill.not-started, .status-pill.locked { background: #f4f6f5; border-color: #d1ddd7; color: #6b7c73; }
        .small-note { color: #60736a; font-size: 11px; line-height: 1.35; }
        .ability-grid, .signal-list, .rec-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; }
        .ability-card, .signal, .recommendation { border: 1px solid #dbe5df; border-radius: 8px; padding: 11px; background: #fbfcfb; display: grid; gap: 6px; }
        .ability-card strong, .signal strong, .recommendation strong { color: #17211e; }
        .signal span { color: #2b6cb0; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; }
        .muted { color: #60736a; }
        .result-pass { color: #0f6b3e; font-weight: 800; }
        .result-fix { color: #9a5b00; font-weight: 800; }
        .print-note { margin-top: 12px; color: #60736a; font-size: 12px; }
        @media (max-width: 820px) {
            .report { width: 100%; margin: 0; border-radius: 0; }
            .summary-grid, .stat-grid { grid-template-columns: 1fr; }
            .hero, .section { padding: 20px; }
            .matrix-wrap { overflow-x: auto; }
        }
        @media print {
            @page { margin: 14mm; }
            body { background: #ffffff; }
            .report { width: 100%; margin: 0; border: 0; box-shadow: none; border-radius: 0; }
            .hero { background: #ffffff; color: #111827; border-bottom: 2px solid #111827; padding: 0 0 14px; }
            .hero p { color: #4b5563; }
            .section { padding: 13px 0; break-inside: avoid; }
            .ability-card, .signal, .recommendation, .stat, tr { break-inside: avoid; }
            .print-note { display: none; }
        }
    </style>
</head>
<body>
    <main class="report">
        <section class="hero">
            <h1>${title}</h1>
            <p>Generated ${escapeHtml(report.exportedAtLabel)}. ${report.scope?.isTopicReport ? "Focused on one practice topic and its current training batch." : "Covers all current practice-topic batches."}</p>
        </section>
        <section class="section">
            <h2>Mastery Snapshot</h2>
            ${renderReportStats(report)}
            <div class="print-note">Use the browser print dialog and choose "Save as PDF" for a clean PDF copy.</div>
        </section>
        <section class="section">
            <h2>Knowledge Mastery Matrix</h2>
            ${renderReportTopicTable(report.topics)}
        </section>
        <section class="section">
            <h2>Ability Evidence</h2>
            ${renderReportSkillMap(report.abilities)}
        </section>
        ${report.reviewLab ? `
        <section class="section">
            <h2>AI Code Review Evidence</h2>
            ${renderReportReviewLab(report.reviewLab)}
        </section>
        ` : ""}
        ${report.qualityStudio && typeof renderQualityStudioReportHtml === "function" ? `
        <section class="section">
            <h2>Code Quality Evidence</h2>
            ${renderQualityStudioReportHtml(report.qualityStudio)}
        </section>
        ` : ""}
        <section class="section">
            <h2>Misconception Signals</h2>
            ${renderReportSignals(report.signals)}
        </section>
        <section class="section">
            <h2>Next Review Plan</h2>
            ${renderReportRecommendations(report.recommendations)}
        </section>
        <section class="section">
            <h2>Recent Trace Evidence</h2>
            ${renderReportExerciseTable(report.recentExercises)}
        </section>
    </main>
    ${autoPrint ? `<script>window.addEventListener("load", () => setTimeout(() => window.print(), 300));<\/script>` : ""}
</body>
</html>`;
}

function renderReportReviewLab(reviewLab) {
    const rows = reviewLab.tasks.map(task => `
        <tr>
            <td><strong>${escapeHtml(task.title)}</strong><div class="small-note">${escapeHtml(task.category)}</div></td>
            <td class="${task.status === "Demonstrated" ? "result-pass" : "result-fix"}">${escapeHtml(task.status)}</td>
            <td>${escapeHtml(task.diagnosis)}</td>
            <td>${escapeHtml(task.tests)}</td>
            <td>${escapeHtml(task.repair)}</td>
            <td>${escapeHtml(task.reasoning)}</td>
            <td>${task.attempts}</td>
        </tr>
    `).join("");

    return `
        <p class="muted"><strong>${reviewLab.completed}/${reviewLab.total}</strong> review challenges demonstrated across ${reviewLab.attempts} evaluated attempt${reviewLab.attempts === 1 ? "" : "s"}; ${reviewLab.drafts || 0} draft${reviewLab.drafts === 1 ? " is" : "s are"} currently in progress. A challenge is demonstrated only when diagnosis, test choice, executable repair, structure, and explanation all pass.</p>
        <div class="matrix-wrap">
            <table>
                <thead><tr><th>Challenge</th><th>Overall</th><th>Diagnosis</th><th>Tests</th><th>Repair</th><th>Reasoning</th><th>Attempts</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function renderReportStats(report) {
    const summary = report.summary;
    const nextText = summary.nextFocusTopic
        ? `${summary.nextFocusTopic}: ${summary.nextFocusLabel}`
        : summary.nextFocusLabel;
    const predictionText = summary.predictionTotal ? `${summary.predictionCorrect}/${summary.predictionTotal}` : "No data";
    const stats = [
        [`${summary.completedLevels}/${summary.totalLevels}`, "Current levels completed"],
        [`${summary.independentLevels}`, "Independent mastery signals"],
        [`${summary.supportLevels}`, "Levels needing support/help"],
        [`${summary.passedRuns}/${summary.runCount || 0}`, "Compile runs passed"],
        [predictionText, "Trace predictions correct"],
        [summary.helpEvents, "Help events recorded"]
    ];

    return `
        <div class="summary-grid">
            <div class="narrative">
                <p><strong>${escapeHtml(report.narrative.headline)}</strong></p>
                <p>${escapeHtml(report.narrative.strength)}</p>
                <p>${escapeHtml(report.narrative.mastery)}</p>
                <p>${escapeHtml(report.narrative.trace)}</p>
                <p>${escapeHtml(report.narrative.risk)}</p>
                <p><strong>Suggested next focus:</strong> ${escapeHtml(nextText)}</p>
            </div>
            <div class="stat-grid">
                ${stats.map(([value, label]) => `<div class="stat"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("")}
            </div>
        </div>
    `;
}

function renderReportTopicTable(topics) {
    const levelHeaders = Object.entries(REPORT_LEVEL_ABILITIES)
        .map(([level, ability]) => `<th>L${level}<br><span class="small-note">${escapeHtml(ability.title)}</span></th>`)
        .join("");
    const rows = topics.map(topic => `
        <tr>
            <td>
                <strong>${escapeHtml(topic.title)}</strong><br>
                <span class="small-note">${topic.completedCount}/${topic.totalCount} complete | Next: ${escapeHtml(topic.nextLevel)}</span>
            </td>
            ${Object.keys(REPORT_LEVEL_ABILITIES).map(levelText => {
                const level = topic.levels.find(item => item.level === Number(levelText));
                if (!level) return `<td><span class="status-pill locked">Missing</span></td>`;
                return `
                    <td>
                        <div class="matrix-cell">
                            ${renderStatusPill(level.statusKey, level.statusLabel)}
                            <span class="small-note">${escapeHtml(level.taskTitle)}</span>
                            <span class="small-note">${level.attempts ? `${level.attempts} run${level.attempts === 1 ? "" : "s"}` : "no session run"}</span>
                        </div>
                    </td>
                `;
            }).join("")}
        </tr>
    `).join("");

    return `
        <div class="matrix-wrap">
            <table>
                <thead><tr><th>Topic</th>${levelHeaders}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function renderStatusPill(statusKey, label = getReportStatusMeta(statusKey).label) {
    return `<span class="status-pill ${escapeHtml(getReportStatusMeta(statusKey).className)}">${escapeHtml(label)}</span>`;
}

function renderReportSkillMap(abilities) {
    return `
        <div class="ability-grid">
            ${abilities.map(ability => `
                <div class="ability-card">
                    <div>${renderStatusPill(ability.statusKey, ability.statusLabel)}</div>
                    <strong>${escapeHtml(ability.short)}: ${escapeHtml(ability.title)}</strong>
                    <span class="muted">${escapeHtml(ability.evidence)}</span>
                    <span class="small-note">${escapeHtml(ability.nextCheck)}</span>
                </div>
            `).join("")}
        </div>
    `;
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
        return `<p class="muted">No compile evidence has been recorded in this browser session yet. Stored completion can still appear in the matrix, but attempt-level diagnosis needs fresh runs.</p>`;
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
const savedReviewLabTaskId = localStorage.getItem(REVIEW_LAB_ACTIVE_KEY);
if (savedReviewLabTaskId && REVIEW_LAB_TASKS.some(task => task.id === savedReviewLabTaskId)) {
    activeReviewLabTaskId = savedReviewLabTaskId;
}
renderReviewLab();
renderDashboard();
renderQuestionBank();
renderInitialConsole();
updateRunAvailability();
maybePromptCompletedTopic(activeLessonId);
maybeStartGuide();
