function render(title, spec, width, height, div) {
    var config = new MCP.Parser.Configuration(spec);

    if(!div) {
        var body = document.getElementsByTagName('body')[0],
            wrapper = document.createElement("div");

        div = document.createElement("div");
        div.appendChild(document.createTextNode(title));
        div.appendChild(document.createElement("br"));
        div.appendChild(wrapper);
        body.appendChild(div);
    }

    config.load('/data/').then(function() {
        var interp = new MCP.Interpreter(config);
        
        interp.interpret();
        interp.render(div, width, height);
    });   
}