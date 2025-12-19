(function () {
    'use strict';
    var SeriesFix = {
        init: function () {
            this.injectStyles();
            this.startObserver();
        },
        injectStyles: function () {
            if (document.getElementById('series-fix-css')) return;
            var css = `
                .card .card-watched { display: none !important; } 
                .ep-watched-layer {
                    position: absolute;
                    left: 0.5em;
                    right: 0.5em;
                    bottom: 0.5em;
                    z-index: 5;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                }
                .card.focus .ep-watched-layer,
                .card:hover .ep-watched-layer {
                    opacity: 1;
                }
                .ep-progress-bar {
                    background: rgba(0,0,0,0.6);
                    height: 4px;
                    width: 100%;
                    border-radius: 2px;
                    overflow: hidden;
                    margin-top: 5px;
                }
                .ep-progress-fill {
                    background: #f0ad4e; 
                    height: 100%;
                    width: 0%;
                    transition: width 0.3s;
                }
                .ep-text-info {
                    background: rgba(0, 0, 0, 0.85);
                    color: #fff;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 0.8em;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.5);
                    margin-bottom: 2px;
                    backdrop-filter: blur(2px);
                }
                .ep-text-details {
                    font-size: 0.75em;
                    opacity: 0.8;
                }
            `;
            var style = document.createElement('style');
            style.id = 'series-fix-css';
            style.innerHTML = css;
            document.head.appendChild(style);
        },
        startObserver: function () {
            document.body.addEventListener('mouseover', function (e) {
                var card = e.target.closest('.card');
                if (card) {
                    var data = card.card_data || (window.jQuery && window.jQuery(card).data('data'));
                    if (data && !card.classList.contains('card--wide')) {
                        SeriesFix.render(card, data);
                    }
                }
            });
        },
        render: function (card, data) {
            var existingLayer = card.querySelector('.ep-watched-layer');
            if (existingLayer) {
                 if (existingLayer.dataset.id == data.id) {
                     return; 
                 } else {
                     existingLayer.remove(); 
                 }
            }
            var viewHistory = Lampa.Storage.get('file_view', '{}');
            var itemHistory = viewHistory[data.id];
            if (!itemHistory) return;
            var isSeries = (data.number_of_seasons > 0 || data.original_name || (data.meta && data.meta.type === 'tv'));
            if (isSeries) {
                this.renderSeries(card, data, itemHistory);
            } else {
                this.renderMovie(card, data, itemHistory);
            }
        },
        renderSeries: function (card, data, history) {
            var viewedEpisodes = 0;
            var totalDuration = 0;
            var lastEpisode = '';
            for (var key in history) {
                if (history.hasOwnProperty(key)) {
                    var percent = 0;
                    if (history[key].duration > 0) {
                        percent = (history[key].time / history[key].duration) * 100;
                    } else if (history[key].percent) {
                        percent = history[key].percent;
                    }
                    if (percent > 85) {
                        viewedEpisodes++;
                    }
                    lastEpisode = key;
                }
            }
            var totalEpisodes = data.number_of_episodes || data.episodes_count || 0;
            if (totalEpisodes < viewedEpisodes) totalEpisodes = viewedEpisodes;
            if (viewedEpisodes > 0) {
                var html = '';
                var percentWatched = totalEpisodes > 0 ? Math.min(100, (viewedEpisodes / totalEpisodes) * 100) : 0;
                html += '<div class="ep-text-info">';
                if (totalEpisodes > 0) {
                    html += viewedEpisodes + ' из ' + totalEpisodes;
                } else {
                    html += 'Просмотрено: ' + viewedEpisodes;
                }
                html += '</div>';
                html += '<div class="ep-progress-bar"><div class="ep-progress-fill" style="width: ' + percentWatched + '%"></div></div>';
                this.appendLayer(card, data.id, html);
            }
        },
        renderMovie: function (card, data, history) {
            var time = history.time || 0;
            var duration = history.duration || 0;
            if (!time && !duration && Object.keys(history).length > 0) {
                var firstKey = Object.keys(history)[0];
                if (history[firstKey] && history[firstKey].time) {
                    time = history[firstKey].time;
                    duration = history[firstKey].duration;
                }
            }
            if (duration > 0) {
                var percent = Math.min(100, (time / duration) * 100);
                if (percent > 1) { 
                    var html = '<div class="ep-text-info">' + Math.round(percent) + '%</div>';
                    html += '<div class="ep-progress-bar"><div class="ep-progress-fill" style="width: ' + percent + '%"></div></div>';
                    this.appendLayer(card, data.id, html);
                }
            }
        },
        appendLayer: function (card, id, innerHTML) {
            var layer = document.createElement('div');
            layer.className = 'ep-watched-layer';
            layer.dataset.id = id; 
            layer.innerHTML = innerHTML;
            card.appendChild(layer);
        }
    };
    if (window.appready) {
        SeriesFix.init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') SeriesFix.init();
        });
    }
})();
