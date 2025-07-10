// demo.js

// A simple function for demonstration
function calculateSum(a, b) {
  // ESLint will typically warn about unused variables if configured for 'no-unused-vars'
  const unusedVariable = "This variable is not used.";

  // ESLint will warn about using 'var' if 'no-var' rule is enabled (prefer 'const'/'let')
  var result = a + b; // ESLint: 'var' should not be used. Use 'let' or 'const' instead.

  // This is a common pattern that eslint-plugin-security might flag (e.g., security/detect-eval-with-expression)
  // if rules are strict enough and 'eval' is used with untrusted input (though here it's static)
  eval("console.log('Result is: ' + result);");

  return result;
}

// Call the function
calculateSum(5, 10);

// A console log for basic output
console.log("Verification JavaScript file executed.");
