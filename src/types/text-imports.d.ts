/** `.md` files import as their text (`loader` in angular.json). */
declare module '*.md' {
    const content: string
    export default content
}
