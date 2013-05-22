;
(function($, window, document, undefined) {

  state = {
    NEW: 0,
    PUSH: 1
  };

  var Durchflussrechner = function(id) {
    var self = this;
    this.id = id;
    this.buttons = $('#' + id + ' .button');
    this.display = $('#' + id + ' #result');

    this.result = 0.0;
    this.operand = null;
    this.operation = null;
    this.state = state.PUSH;

    /**
     * Wir müssen prüfen, ob bereits ein Dezimal-Zeichen eingegeben wurde oder nicht
     */
    this.hasDecimal = false;


    Durchflussrechner.prototype.initBindings = function() {
      console.log(self.buttons);

      $(self.buttons).each(function(index, button) {
        $(button).mousedown(function() {
          if ($(button).hasClass('number') || $(button).hasClass('decimal_sign')) {
            //Die angeklickte Zahl oder das Dezimal-Zeichen wird in das Display eingetragen
            self.pushDisplay($(button).text());

          } else if ($(button).hasClass('operation')) {

            //Bei einem Klick auf eine Operation, wird diese in die Variable this.operation als Funktion eingetragen
            var operation = self.getFunctionByName($(button).attr('id'));
            self.setOperation(operation);
            self.clearDisplay();

            /**
             * bei der zweiten Operation muss die erste schon ausgeführt werden!!!
             */

//            console.log('OPERAND 1', self.getResult());
//            console.log('OPERATION', self.operation);
//            console.log('OPERAND 2', self.operand);
            
          } else if ($(button).hasClass('equals')) {
            
            /**
             * Wenn auf = geklickt wird, muss das Ergebnis berechnet und angezeigt werden
             */
            
//            console.log('OPERAND 1', self.getResult());
//            console.log('OPERATION', self.operation);
//            console.log('OPERAND 2', self.operand);

            if(self.operation !== null){
              self.setResult(self.operation(self.getResult(), self.operand));
              self.state = state.NEW;
            }
//            self.operation = null;
          } else if ($(button).hasClass('transformation')) {

            //Die Zahl in der Anzeige wird transformiert, mittels der Operation, die angegeben wurde
            var transformation = self.getFunctionByName($(button).attr('id'));
            self.setResult(transformation(self.getResult()));

          }
        });
      });
    };

    Durchflussrechner.prototype.pushDisplay = function(value) {
      var oldNumber = this.display.html();
      /**
       * Wenn im Markup ein Komma eingegeben wurde, richten wir alles auf Kommata ein
       */
      var komma = ($('#' + id + ' #decimal').text().indexOf(',') >= 0);
      var decimal = '.';
      if (komma) {
        decimal = ',';
        oldNumber = oldNumber.replace(/,/g, '.');
      }
      var newNumber = (oldNumber === '0' || self.state === state.NEW) ? value.toString() : oldNumber + value.toString();

      if (value === decimal) {
        if (!this.hasDecimal) {
          newNumber = (parseFloat(oldNumber) === 0 || self.state === state.NEW) ? '0' + decimal : oldNumber + value.toString();
          this.hasDecimal = true;
        } else {
          return;
        }
      }
      
      /**
       * Der Zustand gibt an, ob die neue Eingabe den Wert im Display überschreibt oder den Wert hinzufügt
       */
      if(self.state === state.NEW){
        self.state = state.PUSH;
      }
      
      
      console.log('STATE: ', self.state);
      
      /**
       * Der Punkt muss evtl. wieder durch ein Komma ersetzt werden
       */
      if (komma) {
        newNumber = newNumber.replace(/\./g, ',');
      }
      
      this.display.html(newNumber);
    };

    Durchflussrechner.prototype.setResult = function(value) {
      self.result = parseFloat(value);
      var result_display = self.result;
      
      if(!isFinite(self.result)){
        result_display = 'ERROR';
        self.clearDurchflussrechner();
        /**
         * #TODO: Zustand: Neue Eingabe!
         */
      }
      
      $('#' + id + ' ' + '#result').html(result_display);
      console.log('self.result', self.result);
    };

    Durchflussrechner.prototype.getResult = function() {
      this.result = parseFloat($('#' + id + ' ' + '#result').text());
      return this.result;
    };

    Durchflussrechner.prototype.setOperation = function(operation) {
      this.operation = operation;
      self.operand = self.getResult();
//      this.clear();
//      $('#' + id + ' #operation_display').html(this.operation.toString());
    };

    Durchflussrechner.prototype.getOperation = function() {
      return this.operation;
    };

    Durchflussrechner.prototype.checkDecimal = function() {
      var check = false;
      if (this.display.text().indexOf(',') >= 0 || this.display.text().indexOf('.') >= 0) {
        check = true;
      }
      this.hasDecimal = check;
      return check;
    };

    Durchflussrechner.prototype.clearDisplay = function() {
      this.setResult(0);
    };

    Durchflussrechner.prototype.clearAll = function() {
      this.clearDisplay();
      this.clearDurchflussrechner();
    };

    Durchflussrechner.prototype.clearDurchflussrechner = function() {
      this.operand = null;
      this.operation = null;
      self.state = state.NEW;
    };

    Durchflussrechner.prototype.getFunctionByName = function(name) {
      var myFunction = null;
      for (var property in self) {
        if (typeof self[property] === 'function') {
          if (name === property) {
            myFunction = self[property];
          }
        }
      }
      return myFunction;
    };
    
    
    /**
     * OPERATIONS
     * 
     * Eine Operation ist eine Funktion mit zwei Parametern
     */
    
    Durchflussrechner.prototype.addition = function(x, y) {
      return x + y;
    };


    Durchflussrechner.prototype.subtraction = function(x, y) {
      return x - y;
    };


    Durchflussrechner.prototype.multiplication = function(x, y) {
      return x * y;
    };

    Durchflussrechner.prototype.division = function(x, y) {
      return x / y;
    };
    
    Durchflussrechner.prototype.percent = function(x, y) {
      return (y / x) * 100;
    };
    
    /**
     * TRANSFORMATIONS
     * 
     * Eine Transformation ist eine Funktion mit zwei Parametern
     */
    
    Durchflussrechner.prototype.square_root = function(x) {
      return Math.sqrt(x);
    };    
    
    Durchflussrechner.prototype.negation = function(x) {
      return x * -1;
    };    
    
    Durchflussrechner.prototype.fraction_1_x = function(x) {
      return 1 / x;
    };    
    
    /**
     * 
     * Initialisierung
     * 
     */
    self.checkDecimal();
    self.initBindings();

  };




  $(function() {
    var durchflussrechner = new Durchflussrechner('durchflussrechner');
  });
})(jQuery, window, document);