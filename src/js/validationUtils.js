const isPromise = require('./util').isPromise
const isValidValidationError = require('./util').isValidValidationError
const stringifyPath = require('./util').stringifyPath

/**
 * Execute custom validation if configured.
 *
 * Returns a promise resolving with the custom errors (or an empty array).
 */
function validateCustom (json, onValidate) {
  if (!onValidate) {
    return Promise.resolve([])
  }

  try {
    const customValidateResults = onValidate(json)

    const resultPromise = isPromise(customValidateResults)
      ? customValidateResults
      : Promise.resolve(customValidateResults)

    return resultPromise.then(customValidationPathErrors => {
      if (Array.isArray(customValidationPathErrors)) {
        return customValidationPathErrors
          .filter(error => {
            const valid = isValidValidationError(error)

            if (!valid) {
              console.warn('Ignoring a custom validation error with invalid structure. ' +
                    'Expected structure: {path: [...], message: "..."}. ' +
                    'Actual error:', error)
            }

            return valid
          })
          .map(error => // change data structure into the structure matching the JSON schema errors
            ({
              dataPath: stringifyPath(error.path),
              message: error.message
            }))
      } else {
        return []
      }
    })
  } catch (err) {
    return Promise.reject(err)
  }
}

exports.validateCustom = validateCustom