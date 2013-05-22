;
(function($, window, document, undefined) {

  state = {
    NEW: 0,
    PUSH: 1
  };
  
  durchflusstype = {
    GASE: 0,
    FLUESSIGKEITEN: 1
  };
  
  rechnermodus = {
    RECHNER: 'Rechner',
    DURCHFLUSS: 'Durchfluss',
    CV: 'CV'
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
    this.rechnermodus = rechnermodus.RECHNER;

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
              self.setResult(self.operation(self.operand, self.getResult()));
              self.state = state.NEW;
            }
//            self.operation = null;
          } else if ($(button).hasClass('transformation')) {

            //Die Zahl in der Anzeige wird transformiert, mittels der Operation, die angegeben wurde
            var transformation = self.getFunctionByName($(button).attr('id'));
            self.setResult(transformation(self.getResult()));

          } else if($(button).hasClass('switch_view')){
            
            /**
             * Es gibt drei Buttons, mit denen wir verschiedene Views umschalten müssen
             */
            self.toggleView($(button).attr('id'));
            
          } else if($(button).hasClass('fluss_operation')){
            var fluss_function = self.getFunctionByName($(button).attr('id'));
            self.setResult(fluss_function());
          }
        });
      });
    };

    Durchflussrechner.prototype.pushDisplay = function(value) {
      var oldNumber = this.display.html();
      /**
       * Wenn im Markup ein Komma eingegeben wurde, richten wir alles auf Kommata ein
       */
      var komma = ($('#' + self.id + ' #decimal').text().indexOf(',') >= 0);
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
      
      $('#' + self.id + ' ' + '#result').html(result_display);
      console.log('self.result', self.result);
    };

    Durchflussrechner.prototype.getResult = function() {
      this.result = parseFloat($('#' + self.id + ' ' + '#result').text());
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
     * Diese Funktion kümmert sich um die Anzeige der passenden View. Dazu muss die passende id
     * 'Durchfluss', 'CV' oder 'Rechner' übergeben werden 
     *
     * 
     * @param string id
     * @returns
     */
    Durchflussrechner.prototype.toggleView = function(id){
      $('#' + this.id + ' .middle').css('display', 'none');
      this.rechnermodus = id;
      
      if(id === rechnermodus.CV || id === rechnermodus.DURCHFLUSS){

        $('#' + this.id + ' #Fluss_view')
              .css('display', 'block')                                                   //View anzeigen
              .css('width', $('#' + this.id + ' .middle#Rechner_view').css('width'))     //Breite angleichen
              .css('height', $('#' + this.id + ' .middle#Rechner_view').css('height'));  //Höhe angleichen
        
        $('#' + this.id + ' .button#Rechner').css('display', 'block');
        $('#' + this.id +  ' .button#CE, .button#clear').css('display', 'none');
        $('#' + this.id +  ' .right').css('display', 'none');
        
        switch (id){
          case 'CV':
            $('#' + this.id + ' .' + id + '_view').css('display', 'block');
            $('#' + this.id + ' .Durchfluss_view').css('display', 'none');
            break;
          case 'Durchfluss':
            $('#' + this.id + ' .' + id + '_view').css('display', 'block');
            $('#' + this.id + ' .CV_view').css('display', 'none');
            break;
          default:
            break;
        }
        
      }else if(id === rechnermodus.RECHNER){
        $('#' + this.id + ' #Rechner_view').css('display', 'block')                                                   //View anzeigen
        $('#' + this.id + ' .button#Rechner').css('display', 'none');
        $('#' + this.id + ' .button#CE, .button#clear').css('display', 'inline-block');
        $('#' + this.id +  ' .right').css('display', 'block');
      }
      
      
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
    
    Durchflussrechner.prototype.berechneFluss = function() {
      var result = 0;
      var type = parseInt($('#' + self.id +  ' #durchflusstype').val());
      switch(self.rechnermodus){
        case rechnermodus.CV:
          result = self.berechneCV(type);
          break;
        case rechnermodus.DURCHFLUSS:
          result = self.berechneDurchfluss(type);
          break;
        default:
          window.alert('Der Rechner ist im Falschen Modus');
          return null;
          break;
      }
      return result;
    };
    
    Durchflussrechner.prototype.berechneCV = function(type) {
      switch(type){
        case durchflusstype.GASE:
          return 111112;
          break;
        case durchflusstype.FLUESSIGKEITEN:
          return 1111113;
          break;
        default:
          window.alert('Bitte auswählen...');
           break;
      }
    };
    
    Durchflussrechner.prototype.berechneDurchfluss = function(type) {
      switch(type){
        case durchflusstype.GASE:
          return 2222221;
          break;
        case durchflusstype.FLUESSIGKEITEN:
          return 22222223;
          break;
        default:
          window.alert('Bitte auswählen...');
           break;
      }
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