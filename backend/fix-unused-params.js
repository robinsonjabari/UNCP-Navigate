// Fix Unused Parameters Script
// This script will help fix all unused parameter warnings

const fs = require("fs")
const path = require("path")

const fixes = [
  // Routes that don't need req parameter
  {
    file: "src/routes/auth.ts",
    replacements: [
      {
        from: "async (req: Request, res: Response) => {",
        to: "async (_req: Request, res: Response) => {",
      },
      {
        from: 'router.post("/logout", authenticate, async (req: Request, res: Response) => {',
        to: 'router.post("/logout", authenticate, async (_req: Request, res: Response) => {',
      },
      {
        from: 'router.get("/me", authenticate, async (req: Request, res: Response) => {',
        to: 'router.get("/me", authenticate, async (_req: Request, res: Response) => {',
      },
    ],
  },
  // Middleware that don't use all parameters
  {
    file: "src/middleware/errorHandler.ts",
    replacements: [
      {
        from: "next: NextFunction",
        to: "_next: NextFunction",
      },
    ],
  },
  {
    file: "src/middleware/notFound.ts",
    replacements: [
      {
        from: "next: NextFunction",
        to: "_next: NextFunction",
      },
    ],
  },
  {
    file: "src/middleware/auth.ts",
    replacements: [
      {
        from: "res: Response,",
        to: "_res: Response,",
      },
    ],
  },
  {
    file: "src/middleware/validate.ts",
    replacements: [
      {
        from: "res: Response,",
        to: "_res: Response,",
      },
    ],
  },
]

console.log("🔧 This script would fix unused parameter warnings by:")
console.log("1. Adding underscore prefix to unused parameters")
console.log("2. Keeping the strict TypeScript settings")
console.log("3. Following Express.js best practices\n")

fixes.forEach((fix) => {
  console.log(`📁 ${fix.file}:`)
  fix.replacements.forEach((replacement) => {
    console.log(`   ${replacement.from} → ${replacement.to}`)
  })
  console.log("")
})

console.log("📋 Summary:")
console.log("- Parameters prefixed with _ are intentionally unused")
console.log(
  "- This is a TypeScript convention for required but unused parameters"
)
console.log("- No functionality is lost, just cleaner code")
console.log("- Production builds will be cleaner")
