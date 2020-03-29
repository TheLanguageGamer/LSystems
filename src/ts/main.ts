
interface CFGRule {
	lhs : string,
	rhs : string,
}

class LSystem {

	layout : Layout;

	start : string;
	rules : CFGRule[];
	state : string;
	currentStep : number = 0;
	length : number;
	startingLength : number;
	angle : number;
	startingPos : Pos;
	maxSteps : number;

	constructor(obj : {
		start : string,
		rules : CFGRule[],
		angle : number,
		startingPos : Pos,
		startingLength : number,
		maxSteps : number,
	}) {
		this.layout = new Layout(
			0, 0, 0, 0,
			1, 1, 0, 0
		);
		this.start = obj.start;
		this.rules = obj.rules;
		this.angle = obj.angle;
		this.startingPos = obj.startingPos;
		this.maxSteps = obj.maxSteps;
		this.startingLength = obj.startingLength;
		this.length = this.startingLength;
		this.state = this.start;
	}

	reset(obj : {
		start : string,
		rules : CFGRule[],
		angle : number,
		startingPos : Pos,
		startingLength : number,
		maxSteps : number,
	}) {
		this.start = obj.start;
		this.rules = obj.rules;
		this.angle = obj.angle;
		this.startingPos = obj.startingPos;
		this.startingLength = obj.startingLength;
		this.length = this.startingLength;
		this.maxSteps = obj.maxSteps;
		this.state = this.start;
		this.currentStep = 0;
	}

	findTransform(lhs : string) : string | null {
		for (let rule of this.rules) {
			if (rule.lhs == lhs) {
				return rule.rhs;
			} 
		}
		return lhs;
	}

	advance() {
		let newState = "";

		for (let i = 0; i < this.state.length; ++i) {
			let c = this.state[i];
			newState += this.findTransform(c);
		}

		this.currentStep += 1;
		this.state = newState;
		this.length /= 2;
	}

	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {
		let stack : {pos : Pos, angle : number}[] = [];
		stack.push({
			pos : {
				x : this.startingPos.x*this.layout.computed.size.width,
				y : this.startingPos.y*this.layout.computed.size.height,
			},
			angle : -Math.PI/2,
		});
		let pos = stack[0].pos;
		let angle = stack[0].angle;
		let length = this.length;
		let angleDelta = this.angle;

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.moveTo(pos.x, pos.y);

		for (let i = 0; i < this.state.length; ++i) {
			let c = this.state[i];
			if (c == "F") {
				let newPos = {
					x : pos.x + length*Math.cos(angle),
					y : pos.y + length*Math.sin(angle),
				}
				ctx.lineTo(newPos.x, newPos.y);
				pos = newPos;
			} else if (c == "+") {
				angle -= angleDelta;
			} else if (c == "-") {
				angle += angleDelta;
			} else if (c == "[") {
				stack.push({
					pos : pos,
					angle : angle,
				});
			} else if (c == "]") {
				let current = stack.pop() as {pos : Pos, angle : number};
				pos = current.pos;
				angle = current.angle;
				ctx.moveTo(pos.x, pos.y);
			}
		}

		ctx.stroke();
	}
}

class CFGRuleInput {
	
	layout : Layout;
	children : Component[] = [];

	lhsInput : TextInput;
	rhsInput : TextInput;

	constructor(obj : {
		layout : Layout,
		lhs : string,
		rhs : string,
	}) {
		this.layout = obj.layout;

		let fontSize = 14;
		let cfgRuleInputX = 0;
		let lhsInput = new TextInput(
			new Layout(
				0, 0, cfgRuleInputX, 0,
				0, 0, fontSize*obj.lhs.length*0.7, fontSize,
			),
			{},
			obj.lhs
		);
		lhsInput.setFontSize(fontSize);
		lhsInput.fillStyle = Constants.Colors.Black;

		cfgRuleInputX += 20;
		let arrow = new TextLabel(new Layout(
			0, 0, cfgRuleInputX, 0,
			0, 0, 0, fontSize,
		), "⇒");
		arrow.setFontSize(fontSize);
		arrow.fillStyle = Constants.Colors.Black;

		cfgRuleInputX += 20;
		let rhsInput = new TextInput(
			new Layout(
				0, 0, cfgRuleInputX, 0,
				0, 0, fontSize*obj.rhs.length*0.7, fontSize,
			),
			{},
			obj.rhs
		);
		rhsInput.setFontSize(fontSize);
		rhsInput.fillStyle = Constants.Colors.Black;

		this.children.push(lhsInput);
		this.children.push(arrow);
		this.children.push(rhsInput);

		this.lhsInput = lhsInput;
		this.rhsInput = rhsInput;
	}

	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {
		
	}
}

class LabeledCounter {
	
	layout : Layout;
	children : Component[] = [];
	countLabel : TextLabel;
	count : number;
	minCount : number;
	maxCount : number;

	constructor(obj : {
		layout : Layout,
		initialCount : number,
		minCount : number,
		maxCount : number,
		onCountChanged : (newCount : number) => void,
	}) {
		let _this = this;
		this.layout = obj.layout;
		this.count = obj.initialCount;
		this.minCount = obj.minCount;
		this.maxCount = obj.maxCount;

		let labeledCounterX = 0;
		let label = new TextLabel(new Layout(
			0, 0, labeledCounterX, 0,
			0, 0, 0, 0,
		), "Iteration:");
		label.setFontSize(14);
		label.fillStyle = Constants.Colors.Black;

		labeledCounterX += 5 + label.getFontSize()*label.text.length*0.7;

		labeledCounterX += 35;
		let countLabel = new TextLabel(new Layout(
			0, 0, labeledCounterX, 0,
			0, 0, 0, 0,
		), obj.initialCount.toString());
		countLabel.setFontSize(14);
		countLabel.fillStyle = Constants.Colors.Black;

		labeledCounterX -= 35;
		let leftButton = new Button(
			new Layout(
				0, 0, labeledCounterX, 0,
				0, 0, 15, 15
			),
			{
				onClick(e : MouseEvent) {
					console.log("button clicked!");
					_this.count = Math.max(_this.count - 1, _this.minCount);
					obj.onCountChanged(_this.count);
					countLabel.text = _this.count.toString();
					return true;
				}
			},
		);
		leftButton.togglePaths = [ImagePaths.Icons["Left"]];

		labeledCounterX += 35 + 25;
		let rightButton = new Button(
			new Layout(
				0, 0, labeledCounterX, 0,
				0, 0, 15, 15
			),
			{
				onClick(e : MouseEvent) {
					console.log("button clicked!");
					_this.count = Math.min(_this.count + 1, _this.maxCount);
					obj.onCountChanged(_this.count);
					countLabel.text = _this.count.toString();
					return true;
				}
			},
		);
		rightButton.togglePaths = [ImagePaths.Icons["Right"]];

		this.children.push(label);
		this.children.push(leftButton);
		this.children.push(countLabel);
		this.children.push(rightButton);

		this.countLabel = countLabel;
	}

	setCount(newCount : number) {
		this.count = newCount;
		this.countLabel.text = this.count.toString();
	}

	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {
		
	}
}

class Main {
	game : Game;

	constructor(container : HTMLElement) {

		let configurations = [
			{
				label : "Sierpinski Arrowhead",
				id : 5,
				start : "YF",
				rules : [
					{
						lhs : "X",
						rhs : "YF+XF+Y",
					},
					{
						lhs : "Y",
						rhs : "XF-YF-X",
					},
				],
				angle : Math.PI/3,
				startingPos : {x : 0.5, y : 0.8},
				startingLength : 400,
				maxSteps : 7,
			},
			{
				label : "Barnsley fern",
				id : 0,
				start : "X",
				rules : [
					{
						lhs : "F",
						rhs : "FF",
					},
					{
						lhs : "X",
						rhs : "F+[[X]-X]-F[-FX]+X",
					},
				],
				angle : Math.PI/7,
				startingPos : {x : 0.5, y : 0.9},
				startingLength : 200,
				maxSteps : 5,
			},
			{
				label : "Triangle",
				id : 1,
				start : "F+F+F",
				rules : [
					{
						lhs : "F",
						rhs : "F-F+F",
					},
				],
				angle : Math.PI*2/3,
				startingPos : {x : 0.5, y : 0.7},
				startingLength : 300,
				maxSteps : 5,
			},
			{
				label : "Square Sierpinski",
				id : 2,
				start : "F+XF+F+XF",
				rules : [
					{
						lhs : "X",
						rhs : "XF-F+F-XF+F+XF-F+F-X",
					},
				],
				angle : Math.PI/2,
				startingPos : {x : 0.5, y : 0.4},
				startingLength : 100,
				maxSteps : 5,
			},
			{
				label : "Koch Island",
				id : 3,
				start : "X+X+X+X+X+X+X+X",
				rules : [
					{
						lhs : "X",
						rhs : "X+YF++YF-FX--FXFX-YF+X",
					},
					{
						lhs : "Y",
						rhs : "-FX+YFYF++YF+FX--FX-YF",
					},
				],
				angle : Math.PI/4,
				startingPos : {x : 0.5, y : 0.2,},
				startingLength : 7,
				maxSteps : 4,
			},
			{
				label : "Koch Snowflake",
				id : 4,
				start : "F++F++F",
				rules : [
					{
						lhs : "F",
						rhs : "F-F++F-F",
					},
				],
				angle : Math.PI/3,
				startingPos : {x : 0.5, y : 0.8,},
				startingLength : 50,
				maxSteps : 5,
			},
		];

		let lsystem = new LSystem(configurations[0]);
		lsystem.layout = new Layout(
			0, 0, 0, 0,
			1, 1, -200, 0
		);

		let lsystemStateLabel = new TextLabel(new Layout(
			0, 0, 10, 50,
			0, 0, 0, 0
		), lsystem.state);
		lsystemStateLabel.setFontSize(18);
		lsystemStateLabel.fillStyle = Constants.Colors.Black;

		let configurationsDisplay = new Container();
		configurationsDisplay.layout = new Layout(
			1, 0, -10, 90,
			0, 0, 250, 40
		);
		configurationsDisplay.layout.anchor = {x : 1.0, y : 0};
		configurationsDisplay.layout.relativeLayout = RelativeLayout.StackVertical;

		let iterationCount = lsystem.currentStep;
		let iterationContainer = new LabeledCounter({
			layout : new Layout(
				0, 0, 0, 10,
				0, 0, 0, 40
			),
			initialCount : iterationCount,
			minCount : 0,
			maxCount : 10,
			onCountChanged(newCount : number) {
				lsystem.maxSteps = newCount;
				if (newCount < lsystem.currentStep) {
					lsystem.currentStep = 0;
					lsystem.state = lsystem.start;
					lsystem.length = lsystem.startingLength;
					while (lsystem.currentStep < lsystem.maxSteps) {
						lsystem.advance();
					}
				}
				lsystemStateLabel.text = lsystem.state;
			},
		});
		iterationContainer.layout.anchor = {x : 1.0, y : 0};
		configurationsDisplay.children.push(iterationContainer);

		let cfgRuleInputs : CFGRuleInput[] = [];
		for (let j = 0; j < 4; ++j) {
			let cfgRuleInput = new CFGRuleInput({
				layout : new Layout(
					0, 0, 0, 10,
					0, 0, 0, 25
				),
				lhs : j < lsystem.rules.length ? lsystem.rules[j].lhs : "X",
				rhs : j < lsystem.rules.length ? lsystem.rules[j].rhs : "AB",
			});
			if (j >= lsystem.rules.length) {
				cfgRuleInput.layout.visible = false;
			}
			configurationsDisplay.children.push(cfgRuleInput);
			cfgRuleInputs.push(cfgRuleInput);
		}

		let lsystemSelectLayout = new Layout(
			0, 0, 10, 10,
			0, 0, 220, 30
		);

		let lsystemSelect = new Select(
			lsystemSelectLayout, 
			configurations,
			{
				onSelectionChanged(index : number, option : Option) {
					console.log("Selected!", index, option.label);
					lsystem.reset(configurations[index]);
					for (let j = 0; j < cfgRuleInputs.length; ++j) {
						let cfgRuleInput = cfgRuleInputs[j];
						if (j >= lsystem.rules.length) {
							cfgRuleInput.layout.visible = false;
						} else {
							cfgRuleInput.layout.visible = true;
							cfgRuleInput.lhsInput.setText(lsystem.rules[j].lhs);
							cfgRuleInput.rhsInput.setText(lsystem.rules[j].rhs);
						}
					}
				},
			}
		);

		let previousAdvance : null | DOMHighResTimeStamp = null;
		this.game = new Game(container, {
			onUpdate(now : DOMHighResTimeStamp) {
				if ((previousAdvance == null
					|| now - previousAdvance > 200)
					&& lsystem.currentStep < lsystem.maxSteps) {

					previousAdvance = now;
					lsystem.advance();
					lsystemStateLabel.text = lsystem.state;
					iterationContainer.setCount(lsystem.currentStep);
					// iterationCount = lsystem.currentStep;
					// iterationCountLabel.text = lsystem.currentStep.toString();
				}
			},
		});

		this.game.components.push(lsystemStateLabel);
		this.game.components.push(lsystem);
		this.game.components.push(lsystemSelect);

		this.game.components.push(configurationsDisplay);

		this.game.doLayout();
	}
}

let $container = document.getElementById('container')!;
let main = new Main(
	$container,
);
main.game.start();