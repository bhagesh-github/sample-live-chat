// import './index.css'
// import './polyfill'
// import { init, debug } from '@livechat/customer-sdk'
// import * as DOMElements from './DOMElements'
// import * as DOMOperations from './DOMOperations'


/** domElements */
const backButton = document.getElementById('back-button')
const lcWindow = document.getElementById('lc')
const connectionMessage = document.getElementById('connection-message')
const lcWindowMinimized = document.getElementById('lc-minimized')
const footer = document.getElementById('footer')
const startChatButton = document.getElementById('start-chat-button')
const sendButton = document.getElementById('send-button')
const textareaWrapper = document.getElementById('textarea-wrapper')
const input = document.getElementById('message-input')
const minimizeButton = document.getElementById('minimize')

const logoLoader = `
<svg class="resizable-svg" viewBox="0 0 72 99" xmlns="http://www.w3.org/2000/svg">
   <style type="text/css">
       .rectangle-bar {
           fill: #5CA7F5;
       }

       .circle-background {
           fill: transparent;
       }

       .letter-c {
           fill: #31374F;
       }
   </style>
   <rect y="81" class="rectangle-bar" width="72" height="18" />
   <g class="circle">
   <rect class="circle-background" width="72" height="72" />
   <path class="letter-c" d="M49.8,45c-2.9,4.5-8,7.5-13.8,7.5c-9.1,0-16.5-7.4-16.5-16.5c0-9.1,7.4-16.5,16.5-16.5c5.8,0,10.9,3,13.8,7.5
       h21C66.9,11.5,52.8,0,36,0C16.1,0,0,16.1,0,36s16.1,36,36,36c16.8,0,30.9-11.5,34.9-27H49.8z" shape-rendering="geometricPrecision"
   />
   </g>
</svg>
`
/***dom operations */

// import * as DOMElements from './DOMElements'

const isAtTheBottom = (element, tolerance = 20) =>
	element.scrollTop + element.clientHeight >= element.scrollHeight - tolerance

 const getMessageList = () => document.getElementById('chat')

 const createMessage = (id, text, authorType, avatar) => {
	const messageDivContainer = document.createElement('div')
	messageDivContainer.dataset.id = id
	messageDivContainer.classList.add('message-container', authorType)
	if (avatar) {
		const avatarImage = document.createElement('img')
		avatarImage.src = avatar
		avatarImage.classList.add('agent-avatar')
		messageDivContainer.append(avatarImage)
	}
	const messageDiv = document.createElement('div')
	messageDiv.classList.add('message')
	messageDiv.innerHTML = '<div>' + text + '</div>'
	messageDivContainer.append(messageDiv)
	return messageDivContainer
}

 const appendMessage = message => {
	const messageList = getMessageList()
	const shouldScrollToBottom = isAtTheBottom(messageList)
	messageList.appendChild(message)
	if (shouldScrollToBottom) {
		scrollToBottom()
	}
}

 const prependMessages = (chatId, messages) => {
	const messageList = getMessageList(chatId)
	messages.reverse().forEach(message => {
		const firstMessage = messageList.children[0]
		if (firstMessage) {
			messageList.insertBefore(message, firstMessage)
			return
		}
		appendMessage(chatId, message)
	})
}

 const markAsFailedMessage = id => {}

 const confirmMessageAsSent = id => {}

 const disableInput = text => {
	if (text) {
		input.placeholder = text
	}
	input.disabled = true
}

 const enableInput = () => {
	input.placeholder = 'Write a message'
	input.disabled = false
}

 const disableSendButton = () => {
	sendButton.disabled = true
}

 const enableSendButton = () => {
	sendButton.disabled = false
}

 const toggleMinimized = () => {
	lcWindow.classList.toggle('minimized')
	lcWindowMinimized.classList.toggle('minimized')
}

 const scrollToBottom = () => {
	const messageList = getMessageList()
	messageList.scrollTop = messageList.scrollHeight
}

 const showChat = () => {
	startChatButton.style.display = 'none'
	textareaWrapper.style.display = 'flex'

	input.focus()
}

 const showFooter = () => {
	footer.style.display = 'block'
}

 const showStartChatButton = () => {
	startChatButton.style.display = 'inline-block'
}

const closest = (to, element) => {
	const toClass = to.substr(1)
	let target = element
	while (target) {
		if (target.classList.contains(toClass)) {
			return target
		}
		target = target.parentElement
	}

	return null
}

 const delegate = (from, to, eventName, handler) => {
	const targetSelector = `${to}, ${to} *`

	document.querySelector(from).addEventListener(eventName, ev => {
		if (!ev.target.matches(targetSelector)) {
			return
		}

		handler.call(closest(to, ev.target), ev)
	})
}

// TODO: dedupe it later its a copy from "@livechat/chat.io/utils"
// with exception that this one handles context passing
 const throttle = (ms, fn) => {
	let lastCall = Date.now() - 2 * ms
	let result
	let trailing

	function invoke(...args) {
		lastCall = Date.now()
		return (result = fn.apply(this, args))
	}

	return function throttler(...args) {
		const now = Date.now()

		if (now - lastCall >= ms) {
			return invoke.apply(this, args)
		}

		clearTimeout(trailing)
		trailing = setTimeout(() => invoke.apply(this, args), lastCall - now + ms)

		return result
	}
}




const loader = document.getElementById('lc-loader')
loader.innerHTML = logoLoader

const historyStates = {
	DONE: 'DONE',
	INACTIVE: 'INACTIVE',
	LOADING: 'LOADING',
}

const noop = () => {}

const sdk = CustomerSDK.init({ license: 11723820, clientId: 'd027e3eafe5ec10fef43535cd2467647' });
console.log(sdk);
window.sdk = sdk

const state = {
	chat: null,
	active: false,
	activating: false,
	users: {},
	pendingMessages: [],
	customerId: null,
	historyStatus: historyStates.INACTIVE,
	history: null,
}

const isAgent = user => user.id !== state.customerId

sdk.on('connected', ({ chatsSummary, totalChats }) => {
	if (state.chat) {
		return
	}

	enableInput()
	enableSendButton()

	if (totalChats === 0) {
		loader.parentElement.removeChild(loader)
		showFooter()
		showStartChatButton()
		return
	}

	state.chat = chatsSummary[0].id
	state.active = chatsSummary[0].active

	loadInitialHistory().then(() => {
		loader.parentElement.removeChild(loader)
		showFooter()
		showChat()
	})
})

sdk.on('connection_restored', noop)
sdk.on('thread_summary', noop)
sdk.on('user_is_typing', noop)
sdk.on('user_stopped_typing', noop)
sdk.on('user_joined_chat', noop)
sdk.on('user_left_chat', noop)

sdk.on('customer_id', id => {
	state.customerId = id
})

const onConnectionLost = () => {
	disableInput('Disconnected')
	disableSendButton()
}

sdk.on('connection_lost', () => {
	onConnectionLost()
})

sdk.on('diconnected', reason => {
	onConnectionLost()
})

sdk.on('user_data', user => {
	state.users[user.id] = user
})

sdk.on('new_event', ({ chat, event }) => {
	if (!state.chat || event.type !== 'message') {
		return
	}
	const author = state.users[event.author]
	appendMessage(
		createMessage(event.id, event.text, isAgent(author) ? 'agent' : 'customer', author.avatar),
	)
})

const sendMessage = (chat, id, text) => {
	const message = { customId: id, text, type: 'message' }

	sdk.sendEvent(chat, message).then(
		confirmedMessage => {
			confirmMessageAsSent(id)
		},
		() => {
			markAsFailedMessage(id)
		},
	)
}

const startChat = () => {
	state.activating = true
	const activateChat = state.chat ? sdk.activateChat.bind(null, state.chat) : sdk.startChat

	activateChat()
		.then(({ id: chatId }) => {
			showChat()

			state.chat = chatId
			state.active = true
			state.activating = false
			state.historyStatus = historyStates.DONE
			state.pendingMessages.forEach(({ messageId: customId, text: message }) =>
				sendMessage(chatId, customId, message),
			)
			state.pendingMessages = []
		})
		.catch((error) => {
			state.activating = false
			state.pendingMessages.forEach(({ messageId: id }) => markAsFailedMessage(id))
            state.pendingMessages = []
            console.log(error)
		})
}

const handleMessage = () => {
	const text = input.value
	input.value = ''

	if (!text) {
		return
	}

	const messageId = `${Math.random() * 1000}`

	if (state.active) {
		sendMessage(state.chat, messageId, text)
	} else {
		if (!state.activating) {
			startChat()
		}
		state.pendingMessages.push({ messageId, text })
	}

	appendMessage(createMessage(messageId, text, 'customer'))
	scrollToBottom()
}

startChatButton.onclick = startChat

sendButton.onclick = handleMessage

minimizeButton.onclick = toggleMinimized

lcWindowMinimized.onclick = toggleMinimized

input.onkeydown = event => {
	if (event.which !== 13) {
		return
	}
	event.preventDefault()
	handleMessage()
}

const loadHistory = chat => {
	return new Promise((resolve, reject) => {
		state.historyStatus = historyStates.LOADING
		state.history.next().then(
			({ value: events, done }) => {
				if (!events) {
					return
				}

				const messages = events
					.filter(event => event.type === 'message')
					.map(event => {
						const author = state.users[event.author]
						return createMessage(
							event.id,
							event.text,
							isAgent(author) ? 'agent' : 'customer',
							author.avatar,
						)
					})
				const messageList = getMessageList(chat)

				const fromTheBottom = messageList.scrollHeight - (messageList.scrollTop + messageList.clientHeight)

				prependMessages(chat, messages)

				messageList.scrollTop = messageList.scrollHeight - messageList.clientHeight - fromTheBottom

				state.historyStatus = done ? historyStates.DONE : historyStates.INACTIVE
				resolve()
			},
			err => {
				state.historyStatus = historyStates.INACTIVE
				reject(err)
			},
		)
	})
}

const loadInitialHistory = () => {
	const chatId = state.chat

	state.history = sdk.getChatHistory(chatId)

	const loadLatestHistory = () => loadHistory(chatId).then(() => scrollToBottom(chatId))

	return loadLatestHistory()
		.catch(() => loadLatestHistory())
		.catch(noop)
}

delegate(
	'#lc',
	'.chat',
	'mousewheel',
	throttle(300, function loadMore() {
		const chatId = this.dataset.id
		const chat = state.chats[chatId]

		if (this.scrollTop < 50 && chat.historyStatus === historyStates.INACTIVE) {
			loadHistory(chatId).catch(noop)
		}
	}),
)

window.addEventListener('beforeunload', sdk.disconnect)
