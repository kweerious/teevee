WFTDA = {
    utils: {
        rinx_call: function(params) {
            // simple JSONP call with params built from a hash
            var query_string = $.param(params);
            return $.ajax({
                dataType: 'jsonp',
                url: 'http://www.rinxter.net/wftda/ds?' + query_string
            });
        },
        create_grid: function(el) {
            var boutgrid = new dhtmlXGridObject(el);
            boutgrid.enableAutoHeight(true);
            // boutgrid.enableAutoWidth(true);
            boutgrid.setSkin('rx');
            boutgrid.setImagePath('http://rinxter.net/wftda/codebase/grid/imgs/');
            return boutgrid;
        },
        swap_bout_links: function(e) {
            e.preventDefault();

            // get and set bout id to switch to
            WFTDA.bout_id = jQuery(this).data('bout-id');
            WFTDA.tournament_id = jQuery(this).data('tournament-id');
            jQuery('#rinxter').data('bout-id', WFTDA.bout_id);

            // clear old grids
            while (WFTDA.grids.length != 0) {
                var grid = WFTDA.grids.pop();
                jQuery('#'+grid.entBox.id).html('Loading...');
                delete grid;
            }

            // load new bout
            WFTDA.rinx.bout_info();
            jQuery('#bout_tabs a[href="#summary"]').tab('show');
        },
        show_refresh: function() {
            jQuery('#refresh_link').show();
            jQuery('.toggle_refresh').toggle(WFTDA.utils.start_refresh, WFTDA.utils.stop_refresh);

            // add listener for stats refresh
            jQuery('#rinxter').on('refresh_stats', WFTDA.rinx.refresh_stats);
        },
        start_refresh: function() {
            if (WFTDA.refresh_timer != null) { return; }
            WFTDA.refresh_timer = setInterval(
                function() {
                    jQuery('#rinxter').trigger('refresh_stats');
                },
                WFTDA.refresh_rate);
            // fire one right away for usability
            jQuery('#rinxter').trigger('refresh_stats');
            jQuery('.toggle_refresh').text('(on)');
        },
        stop_refresh: function() {
            clearInterval(WFTDA.refresh_timer);
            WFTDA.refresh_timer = null;
            jQuery('.toggle_refresh').text('(off)');
        }
    },
    rinx: {
        init: function() {
            // need something to store DHTMLX grids in for later access
		    WFTDA.grids = [];

            // container and defaults for auto-refresh
            WFTDA.refresh_rate = 30000;
            WFTDA.refresh_timer = null;

            // grab bout id from the page
		    WFTDA.bout_id = jQuery('*[data-bout-id]').data('bout-id');
		    WFTDA.tournament_id = jQuery('*[data-tournament-id]').data('tournament-id');

            if (WFTDA.tournament_id) {
                jQuery('#rinxter').on('click', '.new_bout', WFTDA.utils.swap_bout_links);
            }

            if (WFTDA.bout_id) {
                // fetch bout info
                jQuery('#rinxter').on('load_stats', WFTDA.rinx.load_stats);
                WFTDA.rinx.bout_info();
            }
        },
        init_info: function(data) {
            WFTDA.date = data.date;
            WFTDA.venue = data.venue;
            WFTDA.state = data.state;
            WFTDA.status = data.status;
            WFTDA.sanction = data.sanction;
            WFTDA.team1 = {
                id: data.team1Id,
                name: data.team1league,
                score: data.team1Score,
                logo: data.team1Image
            };
            WFTDA.team2 = {
                id: data.team2Id,
                name: data.team2league,
                score: data.team2Score,
                logo: data.team2Image
            };
        },
        load_stats: function() {
            if(document.getElementById('bout_summary')) {
                WFTDA.rinx.bout_summary('bout_summary');
            };
            if(document.getElementById('top_jammers')) {
                WFTDA.rinx.top_jammers('top_jammers');
            };
            if(document.getElementById('top_penalties')) {
                WFTDA.rinx.top_penalties('top_penalties');
            };
            if(document.getElementById('team1_summary')) {
                WFTDA.rinx.team_summary('team1_summary', WFTDA.team1);
            };
            if(document.getElementById('team2_summary')) {
                WFTDA.rinx.team_summary('team2_summary', WFTDA.team2);
            };
            if(document.getElementById('team1_penalty_summary')) {
                WFTDA.rinx.penalty_summary('team1_penalty_summary', WFTDA.team1);
            };
            if(document.getElementById('team2_penalty_summary')) {
                WFTDA.rinx.penalty_summary('team2_penalty_summary', WFTDA.team2);
            };
        },
        refresh_stats: function() {
            jQuery(WFTDA.grids).each(function() {
                // only update visible gridboxes; search by #id:visible
                if(jQuery('#'+this.entBox.id).is(':visible')) {
                    jQuery(this).trigger('update_data');
                }
            });                    
        },
        bout_info: function() {
            WFTDA.utils.rinx_call({boutId: WFTDA.bout_id, type: 'bout'})
                .done(function(data) {
                    // set basic bout info and setup inital grids/stats once
                    WFTDA.rinx.init_info(data);
                    jQuery('.full_stats_link').attr('href', '/stats/' + WFTDA.bout_id + '.html');
                    jQuery('#rinxter').trigger('load_stats');

                    // show auto refresh only on live events
                    if (WFTDA.status == 'P') {
                        WFTDA.utils.show_refresh();
                    }
                });            
        },
        bout_roster: function() {
            WFTDA.utils.rinx_call({boutId: WFTDA.bout_id, type: 'boutRosters'})
        },
        tournament_info: function() {
            WFTDA.utils.rinx_call({tournamentId: WFTDA.tournament_id, type: 'tournament'})
                .done(function(data) {
                    WFTDA.tournament = {name: data.name, image: data.image};
                });
        },
        tournament_list: function() {
            WFTDA.utils.rinx_call({tournamentId: WFTDA.tournament_id, type: 'boutList'})
                .done(function(data) {
                    WFTDA.tournament.bouts = data;
                });
        },
        bout_summary: function(el) {
            var summary = WFTDA.utils.create_grid(el);
            summary.setHeader(
                 'Summary,' + WFTDA.team1.name + ',#cspan,#cspan,' + WFTDA.team2.name + ',#cspan,#cspan'
            );
            summary.attachHeader('#rspan,Per 1,Per 2,Total,Per 1,Per 2,Total');
            summary.setInitWidths('140,40,40,40,40,40,40');
            summary.setColAlign('left,center,center,center,center,center,center');
            summary.init();

            WFTDA.grids.push(summary);

            jQuery(summary).on('update_data', function() {
                var grid = this;
                WFTDA.utils.rinx_call({
                    type: 'boutSummary',
                    boutId: WFTDA.bout_id,
                    output: 'tab',
                    columns: 'param,team1p1,team1p2,team1tot,team2p1,team2p2,team2tot'
                })
                .done(function(data) {
                    grid.clearAll();
                    grid.parse(data, 'json');
                });
            }).trigger('update_data');;
        },
        top_jammers: function(el) {
            var summary = WFTDA.utils.create_grid(el);
            summary.setHeader(WFTDA.team1.name + ',#cspan,#cspan,#cspan,,' + WFTDA.team2.name + ',#cspan,#cspan,#cspan');
            summary.attachHeader('Skater,Jams,Lead,Score,,Skater,Jams,Lead,Score');
            summary.setInitWidths('100,*,*,*,0,100,*,*,*');
            summary.setColAlign('left,center,center,center,center,left,center,center,center');
            summary.init();

            WFTDA.grids.push(summary);

            jQuery(summary).on('update_data', function() {
                var grid = this;
                WFTDA.utils.rinx_call({
                    type: 'boutTopJammers',
                    boutId: WFTDA.bout_id,
                    output: 'tab'
                })
                .done(function(data) {
                    grid.clearAll();
                    grid.parse(data, 'json');
                });
            }).trigger('update_data');
        },
        top_penalties: function(el) {
            var summary = WFTDA.utils.create_grid(el);
            summary.setHeader(WFTDA.team1.name + ',#cspan,#cspan,#cspan,,' + WFTDA.team2.name + ',#cspan,#cspan,#cspan');
            summary.attachHeader('Skater,Min,Maj,Box,,Skater,Min,Maj,Box');
            summary.setInitWidths('100,*,*,*,0,100,*,*,*');
            summary.setColAlign('left,center,center,center,center,left,center,center,center');
            summary.init();

            WFTDA.grids.push(summary);

            jQuery(summary).on('update_data', function() {
                var grid = this;
                WFTDA.utils.rinx_call({
                    type: 'boutTopPenalties',
                    boutId: WFTDA.bout_id,
                    output: 'tab'
                })
                .done(function(data) {
                    grid.clearAll();
                    grid.parse(data, 'json');
                });
            }).trigger('update_data');
        },
        team_summary: function(el, team) {
            var summary = WFTDA.utils.create_grid(el);
            summary.setHeader(team.name +',Total Jams,Jammer,#cspan,#cspan,#cspan,#cspan,#cspan,#cspan,#cspan,Pivot,#cspan,#cspan,#cspan,#cspan,#cspan,#cspan,Blocker,#cspan,#cspan,#cspan,#cspan,#cspan,#cspan,Min,Maj,Box');
            summary.attachHeader('#rspan,#rspan,Jams,LJ,% LJ,Plus,Minus,w/o Star Pass, +/-,Avg +/-,Jams,LJ,% LJ,Plus,Minus,+/-,Avg +/-,Jams,LJ,% LJ,Plus,Minus,+/-,Avg +/-,#rspan,#rspan,#rspan');
            summary.setInitWidths('160,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30');
            summary.init();

            WFTDA.grids.push(summary);

            jQuery(summary).on('update_data', function() {
                var grid = this;
                WFTDA.utils.rinx_call({
                    type: 'skaterStats',
                    boutId: WFTDA.bout_id,
                    teamId: team.id,
                    output: 'tab'
                })
                .done(function(data) {
                    grid.clearAll();
                    grid.parse(data, 'json');
                });
            }).trigger('update_data');
        },
        penalty_summary: function(el, team) {
            var summary = WFTDA.utils.create_grid(el);
            summary.setHeader('Summary,Minor,#cspan,#cspan,#cspan,Minor,#cspan,#cspan,#cspan,Minor,#cspan,#cspan,#cspan,Minor,#cspan,#cspan,#cspan,Penalty Minutes,#cspan,#cspan,#cspan,#cspan,#cspan,#cspan,#cspan');
            summary.attachHeader('#rspan,1,2,3,4,1,2,3,4,1,2,3,4,1,2,3,4,1,2,3,4,5,6,7,8');
            summary.setInitWidths('100,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35');
            summary.init();

            WFTDA.grids.push(summary);

            jQuery(summary).on('update_data', function() {
                var grid = this;
                WFTDA.utils.rinx_call({
                    type: 'boutPenalties',
                    boutId: WFTDA.bout_id,
                    teamId: team.id,
                    output: 'tab'
                })
                .done(function(data) {
                    grid.clearAll();
                    grid.parse(data, 'json');
                });
            }).trigger('update_data');
        }
    }
}