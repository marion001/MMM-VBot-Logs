//Code By: Vũ Tuyển
//Designed by: BootstrapMade
//GitHub VBot: https://github.com/marion001/VBot_Offline.git
//Facebook Group: https://www.facebook.com/groups/1148385343358824
//Facebook: https://www.facebook.com/TWFyaW9uMDAx
//Email: VBot.Assistant@gmail.com

Module.register("MMM-VBot-Logs", {
    defaults: {
        wsAddress: "ws://localhost:8765",			//địa chỉ Socket Server máy Chủ VBot
        maxLines: 20,								//Số lượng dòng logs tối đa cần hiển thị
        reconnectInterval: 10,						//thời gian kết nối lại khi mất kết nối (giây)
		baseLength: 50,								//số lượng từ cho phép để cắt chuỗi
		tolerance: 12,								//dung sai số lượng từ cho phép cắt chuỗi
		useWrapText: false,							//true sẽ thực hiện cắt chuỗi dài ở cả code, false tự động cắt chuỗi ở css
		titleHeader: "Logs VBot MagicMirror",		//tiêu đề thiết bị kết nối Logs
        highlightKeywords: [
            { keyword: "đang chờ được đánh thức", className: "vbot-log-wait" },
            { keyword: "đã được đánh thức", className: "vbot-log-woke" },
            { keyword: "đang phát nhạc", className: "vbot-log-playing" }
        ]
    },

	start() {
		this.logs = [];
		this.isReconnecting = false;
		this.reconnectCount = 0;
		this.connect();
	},

    getStyles() {
        return ["MMM-VBot-Logs.css"];
    },

    //Hàm helper cắt chuỗi
    wrapText(text, baseLength = 50, tolerance = 12) {
        const lines = [];
        let remaining = text;

        while (remaining.length > 0) {
            if (remaining.length <= baseLength) {
                lines.push(remaining);
                break;
            }

            const sliceEnd = Math.min(remaining.length, baseLength + tolerance);
            const slice = remaining.slice(0, sliceEnd);

            let breakPos = -1;
            const comma = slice.lastIndexOf(",");
            const dot = slice.lastIndexOf(".");
            const space = slice.lastIndexOf(" ");

            if (comma >= baseLength - tolerance) breakPos = comma + 1;
            else if (dot >= baseLength - tolerance) breakPos = dot + 1;
            else if (space >= baseLength - tolerance) breakPos = space + 1;
            else breakPos = baseLength;

            lines.push(remaining.slice(0, breakPos).trim());
            remaining = remaining.slice(breakPos).trim();
        }

        return lines;
    },

	connect() {
		if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
			return;
		}

		this.addLog('Đang kết nối tới: ' + this.config.wsAddress, "wait");

		this.socket = new WebSocket(this.config.wsAddress);

		this.socket.onopen = () => {
			this.isReconnecting = false;
			this.reconnectCount = 0;
			this.addLog('✅ Kết nối thành công tới: ' + this.config.wsAddress, "info");
		};

		this.socket.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				this.addLog(data.text || event.data, "info");
			} catch (e) {
				this.addLog(event.data, "info");
			}
		};

		this.socket.onclose = (event) => {
			if (this.isReconnecting) return;

			this.isReconnecting = true;
			this.reconnectCount = (this.reconnectCount || 0) + 1;

			this.addLog('🔌 Mất kết nối (code: ' + event.code + ') - đang thử kết nối lại...', 'warn');

			setTimeout(() => {
				this.isReconnecting = false;
				this.addLog('🔄 Đang kết nối lại (lần ' + this.reconnectCount + ')...', 'wait');
				this.connect();
			}, this.config.reconnectInterval * 1000);
		};

		this.socket.onerror = (err) => {
			if (!this.isReconnecting) {
				this.addLog('❌ Lỗi kết nối WebSocket tới Logs máy chủ VBot', "error");
			}
			if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
				this.socket.close();
			}
		};
	},

    addLog(text, type = "info") {
        this.logs.push({ text, type });
        if (this.logs.length > this.config.maxLines) this.logs.shift();
        this.updateDom();
    },

	getDom() {
		if (!this.wrapper) {
			this.wrapper = document.createElement("div");
			this.wrapper.classList.add("MMM-VBot-Logs");
			this.wrapper.style.display = "flex";
			this.wrapper.style.flexDirection = "column";
			this.wrapper.style.width = "300px";
			this.wrapper.style.maxWidth = "300px";
			this.wrapper.style.minWidth = "300px";
		}

		this.wrapper.innerHTML = "";

		//header
		const header = document.createElement("div");
		header.innerText = this.config.titleHeader;
		header.classList.add("vbot-log-header");
		this.wrapper.appendChild(header);

		//container log riêng
		const logsContainer = document.createElement("div");
		logsContainer.style.flex = "1 1 auto";
		logsContainer.style.overflowY = "auto";
		logsContainer.style.width = "100%";
		logsContainer.style.maxWidth = "100%";
		logsContainer.style.overflowX = "hidden";
		this.wrapper.appendChild(logsContainer);

		//thêm dòng log
		this.logs.forEach(log => {
			let lines = [];

			if (this.config.useWrapText) {
				//dùng wrapText
				lines = this.wrapText(log.text, this.config.baseLength, this.config.tolerance);
			} else {
				//dùng CSS, chỉ 1 dòng
				lines = [log.text];
			}
			lines.forEach(line => {
				const div = document.createElement("div");
				div.classList.add("vbot-log-line");
				div.innerText = line;

				//map type → class
				const typeMap = {
					error: "vbot-log-error",
					warn: "vbot-log-wait",
					wait: "vbot-log-wait",
					info: "vbot-log-info"
				};

				//ưu tiên theo type
				let className = typeMap[log.type] || "vbot-log-info";

				//chỉ highlight nếu là info (tránh override lỗi/warn)
				if (log.type === "info") {
					for (let kw of this.config.highlightKeywords) {
						if (log.text.toLowerCase().includes(kw.keyword.toLowerCase())) {
							className = kw.className;
							break;
						}
					}
				}

				div.classList.add(className);
				logsContainer.appendChild(div);
			});
		});

		logsContainer.scrollTop = logsContainer.scrollHeight;
		return this.wrapper;
	}

});