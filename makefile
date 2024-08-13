celtic.js: celtic.ts tsconfig.json
	npx tsc

watch:
	ls *.ts | entr -rc npx tsc
