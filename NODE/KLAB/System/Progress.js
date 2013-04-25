Progress = {
    Init: function(bar, stophide) {
        if (typeof (bar) == "string") {
            bar = DOM._get(div);
        }
        var hidder = bar.attr("hidder");
        if (hidder != null) {
            bar.hidder = W.get(hidder);
        }
        bar.value = 0;
        bar.Show = Progress.Show;
        bar.Hide = Progress.Hide;
        bar.Line = W.div("progress");
        bar.Text = W.tag("span", "value");
        bar.add(bar.Line);
        bar.add(bar.Text);
        E.Create(bar, "OnProgressComplete");
        bar.StopHide = stophide;
        bar.Max = parseInt(bar.attr("max"));
        bar.eventType = bar.attr("eventType");
        bar.condition = bar.attr("condition");
        bar.animateBar = Progress.AnimateBar;
        bar.animInterval = window.setInterval(function() { bar.animateBar() }, 50);
        if (bar.eventType != null) {
            bar.eventHandler = Progress.EventHandler;
            bar[bar.eventType] = bar.eventHandler;
            if (bar.condition != null) {
                E.AddHandler(bar.eventType, bar, bar.condition);
            }
            else {
                E.AddHandler(bar.eventType, bar);
            }
        }
        bar.Progress = Progress.Progress;
        return bar;
    },

    AnimateBar: function() {
        if (this.animValue == undefined || this.animValue >= 20) {
            this.animValue = 0;
        }
        else {
            this.animValue++;
        }
        this.style.backgroundPosition = "" + this.animValue + "px 0px"
    },

    Show: function() {
        this.value = -1;
        this.eventHandler();
        this.hidder.show();
        this.show();
    },

    Hide: function() {
        window.clearInterval(this.animInterval);
        E.Events[this.eventType].del(this.eventHandler);
        this.value = 0;
        this.style.backgroundPositionX = "0px";
        this.Line.style.width = "0px";
        this.hide();
        this.hidder.hide();
    },

    EventHandler: function(arg1, arg2) {
        this.value++;
        this.percent = this.value / this.Max;
        this.Text.html((this.percent * 100) + "%");
        var width = this.percent * this.clientWidth;
        this.Line.style.width = width + "px";
        if (this.value >= this.Max) {
            this.OnProgressComplete("Progress", this.value);
            if (!this.StopHide) {
                this.Hide();
            }
        }
    },

    Progress: function(arg1, arg2) {
        this.eventHandler();
    }
}
