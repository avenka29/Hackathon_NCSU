# Best Practices
- Use AI for static stuff, but always double check frontend logic (lists, what not)
- Modularize wherever possible

## Step BY Step
1. Pick the component you want (break down pages into components)
2. AI GENERATE using the context prompt + new instructions about the specific component (prompt till it looks good)
3. Go through the code once and document weird things if needed


# Context Prompt
- Tech Stack: Vite, Tailwind CSS ,React and Typescript
- The router is set up as the following, we use react-router-dom, we have a RootLayout, everything that needs a navbar and footer will be generated within the root layout check layout.tsx for mor information, but all other pages can be generated without layout parent
- [INSERT INFORMATINO ABOUT APPLICATOIN]
- [INSERT INFORMATINO ABOUT THEME AND DESIRED AESTHETICS]
- Make sure to adhere strictly to the themes mentinoed above. Do not add uneccesary gradients. Make sure the app is responsive using cursor-pointer, and setting up hover anmatinos and shadows where appropriate, do not overdo it. 
- Ensure to recommend modularizing the frontend wherever possible