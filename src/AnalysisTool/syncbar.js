import './events';
import { $, AnalysisTool } from './shim';
export { };

/** ******************************************************
* Dual video synchronization / alignment bar.
* This combines:
*  - [A] [B] [AB] Player to control bar
*  - Panel layoutView bar
******************************************************* */
AnalysisTool.SyncBar = function (elParent, videoObj) {
	this.eventListeners = {
		player: [],
		layout: []
	};
	this.videoObj = videoObj;                 // {object<VideoPlayer>} Left and right videos
	this.bar = document.createElement('div'); // {HTMLDivElement} Container for buttons
	this.appendTo(elParent);
};

AnalysisTool.SyncBar.prototype = $.extend(new AnalysisTool.Events(), {
	appendTo: function (elParent) {
		var self = this,
			makeButton = function (action, name, t, title) {
				return ['<button ',
					'class="ac-drawbar-button ac-drawbar-sprite ac-button-' + name + ' ac-togglebutton" ',
					'name="' + name + '" ',
					't="' + (t||'')+'" ',
					'action="' + action + '" ',
					'title="' + AnalysisTool.localize(title).replace(/"/g, "'") + '" ',
					'></button>'].join('');
			};

		$(this.bar)
			.html([
				'<div class="ac-sync-player-buttons">',
				makeButton('player', 'left', 'plya'),
				makeButton('player', 'right', 'plyb'),
				makeButton('player', 'both', 'plab'),
				'</div>',
				AnalysisTool.Drawbar.makeDivider(),
				'<div class="ac-sync-layout-buttons">',
				makeButton('layout', 'sidebyside', 'asbs', 'Side by side view'),
				makeButton('layout', 'topbottom', 'atpb', 'Top Bottom view'),
				makeButton('layout', 'thirdleft', 'atle', 'Third left'),
				makeButton('layout', 'sidebysidefitted', 'asff', 'Fitted'),
				makeButton('layout', 'sidefittedbyside', 'asfs', 'Fitted and full'),
				makeButton('layout', 'pictureinpicture', 'apip', 'Picture in picture'),
				'</div>'
			].join(''))
			.appendTo(elParent);

		$('button', this.bar).click(function (e) {
			self.onButtonClick(e);
		});

		this.updateButtons();
	},

	/** ***************************************************
	* Handle a button click.
	* @param {MouseEvent} e Triggering event from button.
	**************************************************** */
	onButtonClick: function (e) {
		var tgt = e.currentTarget;
		this.onButtonAction(tgt.getAttribute('action'), tgt.getAttribute('name'));
	},

	/** ***************************************************
	* Handle a button action, e.g. on click or from external.
	* @param {string} action Action to execute 'player'|'layout'.
	* @param {string} name Name of action to execute, 'left'|'right'|'sidebyside'|etc.
	**************************************************** */
	onButtonAction: function (action, name) {
		this.fireEvent(action, name);
		this.updateButtons();
	},

	/** ***************************************************
	* Update buttons based on tool state.
	**************************************************** */
	updateButtons: function () {
		var $analysisControl = $(this.bar).closest('.analysisControl'),
			player = $analysisControl.attr('sync-panel'),
			layout = $('.ac-viewwrapper', $analysisControl).attr('view');

		$('button[action="player"]', this.bar).each(function (k, el) {
			$(el).toggleClass('selected', el.getAttribute('name') === player);
		});
		$('button[action="layout"]', this.bar).each(function (k, el) {
			$(el).toggleClass('selected', el.getAttribute('name') === layout);
		});
	}
});
	