build:
	npx webpack

watch:
	ls src/* | entr -rc npx webpack
