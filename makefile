celtic.svg: celtic.js
	node $< > $@

celtic.js: celtic.ts tsconfig.json
	npx tsc
