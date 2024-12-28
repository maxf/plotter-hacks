go:
	tmux split-window -v \; \
	    split-window -h \; \
	    select-pane -t 0 \; send-keys 'make check-watch' Enter \; \
	    select-pane -t 1 \; send-keys 'npm run serve' Enter \; \
	    select-pane -t 2 \; send-keys 'npm run build-watch' Enter

go-new-session:
	tmux new-session -d -s mysession \; \
	    split-window -v \; \
	    split-window -h \; \
	    select-pane -t 0 \; send-keys 'make check-watch' Enter \; \
	    select-pane -t 1 \; send-keys 'npm run serve' Enter \; \
	    select-pane -t 2 \; send-keys 'npm run build-watch' Enter \; \
	    attach

check-watch:
	while inotifywait -e modify ./src; do \
		clear && \
	    npx tsc --noEmit ; \
	done
