mkdir -p js out # Create build dirs
npx tsc src/* --outDir js # Compile to JS
npx browserify -e js/entry.js -o out.js # Compile for browsers