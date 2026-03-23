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
		useIcons: true,								//true = dùng hiển thị icon ảnh, false = không hiển thị icon ảnh
		display_icon_running: true,					//Hiển thị icon VBot khi bật hiển thị ảnh
		titleHeader: "Logs VBot MagicMirror",		//tiêu đề thiết bị kết nối Logs
		//Cấu hình đổi màu Logs textx trả về để hiển thị theo class css
        highlightKeywords: [
			{keyword: "đang chờ được đánh thức", className: "vbot-log-wait"},
			{keyword: "đã được đánh thức", className: "vbot-log-wake"},
			{keyword: "thu âm", className: "vbot-log-rec"},
			{keyword: "human", className: "vbot-log-human"},
			{keyword: "bot", className: "vbot-log-bot"},
			{keyword: "khởi chạy", className: "vbot-log-mode"},
			{keyword: "tìm kiếm", className: "vbot-log-timkiem"},
			{keyword: "không có giọng nói", className: "vbot-log-norec"},
			{keyword: "phát hiện", className: "vbot-log-phathien"},
			{keyword: "system", className: "vbot-log-system"},
			{keyword: "đang phát", className: "vbot-log-playing"}
        ],
		//cấu hình ảnh động, icon, hoạt ảnh theo text trả về từ máy chủ VBot
		imageKeywords: [
			{keyword: "Đã được đánh thức", image: "wake.webp"},
			{keyword: "[HUMAN]:", image: "loading.webp"},
			{keyword: "[BOT]:", image: "speak.webp"},
			{keyword: "[VBot XiaoZhi BOT]:", image: "speak.webp"},
			{keyword: "Đang phát:", image: "music_dance.webp"},
			{keyword: "Đã tắt Mic", image: "mic_off.webp"},
			{keyword: "Đã bật Mic", image: ""},
			{keyword: "Đã tạm dừng:", image: ""},
			{keyword: "Đã dừng phát", image: ""},
			{keyword: "Không có giọng nói", image: ""},
			{keyword: "Đã phát xong:", image: ""}
		]
    },

	start() {
		this.logs = [];
		this.isReconnecting = false;
		this.reconnectCount = 0;
		this.imagePath = this.file("images/");
		this.connect();

		// Tạo div ảnh duy nhất
		if (!this.imageDiv && this.config.useIcons) {
			this.imageDiv = document.createElement("div");
			this.imageDiv.id = "vbot-image";
			this.imageDiv.classList.add("vbot-log-image");
			//this.imageDiv.style.position = "absolute";
			//this.imageDiv.style.top = "10px";
			//this.imageDiv.style.left = "10px";
			//this.imageDiv.style.zIndex = "999";
			if (this.config.display_icon_running){
				//Hiển thị ảnh mặc định ngay khi tạo div
				const defaultImg = document.createElement("img");
				defaultImg.src = this.imagePath + "VBot_favicon.png";
				this.imageDiv.appendChild(defaultImg);
			}
		}

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

	hideIcon() {
		if (this.imageDiv) {
			this.imageDiv.innerHTML = "";
			if (this.config.display_icon_running){
				const defaultImg = document.createElement("img");
				defaultImg.src = this.imagePath + "VBot_favicon.png";
				this.imageDiv.appendChild(defaultImg);
			}
		}
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
			this.wrapper.style.position = "relative";
		}

		this.wrapper.innerHTML = "";

		//header logs text
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

		//Append div ảnh nếu chưa có
		if (this.imageDiv && !this.imageDiv.parentNode) {
			this.wrapper.appendChild(this.imageDiv);
		}

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
				//nếu icon được kích hoạt hiển thị
				if (this.config.useIcons) {
					for (let ik of this.config.imageKeywords) {
						if (line.toLowerCase().includes(ik.keyword.toLowerCase())) {
							if (ik.image) {
								// có ảnh → hiển thị
								this.imageDiv.innerHTML = "";
								const img = document.createElement("img");
								img.src = this.imagePath + ik.image;
								this.imageDiv.appendChild(img);
							} else {
								//không có ảnh → ẩn div
								this.hideIcon();
							}
							break; // chỉ 1 keyword ảnh mỗi log
						}
					}
				}
			});
		});

		logsContainer.scrollTop = logsContainer.scrollHeight;
		return this.wrapper;
	}

});