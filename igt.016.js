/* IOWA Gambling Task Version 0.16 
BY:  Ben Margevicius, ben@margevici.us
Usage: if you add ?email_results_to=you@somedomain.com in the query string
	   if you add ?mail_subject=subject for the email like study id it might be useful here.
EX: http://margevici.us/projects/igt/index.html?email_results_to=test@yahoo.com&mail_subject=A1234B4567
You don't have to do both.
http://margevici.us/projects/igt/index.html?email_results_to=test@yahoo.com

You can bookmark http://margevici.us/projects/igt/index.html?email_results_to=you@somewhere.com and create a shortcut for your subjects.

Please donate to the beer fund paypal: bdm4@po.cwru.edu


The MIT License (MIT)

Copyright (c) 2015 Ben Margevicius, margevici.us

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/


var totalcash = 2000, //cash in the cash pile
        deckAclicks = 0, //clicks for deck A
        deckBclicks = 0, //clicks for deck B
        deckCclicks = 0, //clicks for deck C
        deckDclicks = 0, //clicks for deck D
        totalclicks = 0, //total clicks. if == to MAXGAMES stop playing.  
        penalty = 0,   //penalty store for display
        netgain = 0,   //netgain store fpr display
        email_address = '', //where to email the data to?
        mail_attachment = '', //the results of the test that gets emailed.
        mail_subject = 'IGT data',
		mailsvc_url = '/MailSvc/MailSvc.asmx/SendMail' //Email Service. CORS is disabled so I hope this isn't exploitable.
        GAME_VERSION = "0.16",
        GAME_VERSION_DATE = new Date("February 23, 2015 01:44:00"),    
        DECKA_WIN = 100, //how much did we win on Deck A click
        DECKB_WIN = 100, //how much did we win on Deck B click
        DECKC_WIN = 50, //how much did we win on Deck C click
        DECKD_WIN = 50, //how much did we win on Deck D click
	    CASHMAX = 6000, //Maximum amount of cash that can be won.	
	    MAXGAMES = 100; //maxium amount of plays 100

//Penaly schedules. If lookup DECKN_PENALTY[deckNclicks] to get the preset penalty amount. 
var DECKA_PENALTY = [0, 0, -150, 0, -300, 0, -200, 0, -250, -350, 0, -350, 0, -250, -200, 0, -300, -150, 0, 0, 0, -300, 0, -350, 0, -200, -250, -150, 0, 0, -350, -200, -250, 0, 0, 0, -150, -300, 0, 0];
var DECKB_PENALTY = [0, 0, 0, 0, 0, 0, 0, 0, -1250, 0, 0, 0, 0, -1250, 0, 0, 0, 0, 0, 0, -1250, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1250, 0, 0, 0, 0, 0, 0, 0, 0];
var DECKC_PENALTY = [0, 0, -50, 0, -50, 0, -50, 0, -50, -50, 0, -25, -75, 0, 0, 0, -25, -75, 0, -50, 0, 0, 0, -50, -25, -50, 0, 0, -75, -50, 0, 0, 0, -25, -25, 0, -75, 0, -50, -75];
var DECKD_PENALTY = [0, 0, 0, 0, 0, 0, 0, 0, 0, -250, 0, 0, 0, 0, 0, 0, 0, 0, 0, -250, 0, 0, 0, 0, 0, 0, 0, 0, -250, 0, 0, 0, 0, 0, -250, 0, 0, 0, 0, 0];
var selectedCards = []; //stores the selections for output when the game is over.

//http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

//rewards preprogramed pentalties are higher for deck A & B.
$(function () {
    $("#game_version").html(GAME_VERSION);
    $("#testresults").hide();
    $(".spinner").hide();    
    $("#emailResultsTo").val(getParameterByName('email_results_to')); //get the query string value for auto address filling :)
	$("#subjectID").val(getParameterByName('mail_subject')); //get the query strung for the subject for the email. 
	
    $('#modal-splash').modal('show'); //show the instructions modal on first load

    $("#emailBtn").click(function () {
        email_address = $("#emailResultsTo").val();			
		if($("#subjectID").val() !== "") mail_subject = $("#subjectID").val();
		
        if (email_address.length && mail_attachment.length) { //if there is no email address or data to post then don't do it.
            $.ajax({
                type: 'POST',
                contentType: "application/json; charset=utf-8",
                url: mailsvc_url,
                data: "{ to:" + JSON.stringify(email_address) + 
					  ", subject: " + JSON.stringify(mail_subject) +
					  ", attachdata: " + JSON.stringify(mail_attachment) + "}",
                dataType: "json",
                success: function (data, status, jqxhr) {
					var d = (data.d) ? data.d : data;
					$(".spinner").hide();    
					if(d.isError) 
					{
						console.error(d.LongWindedDrawnOutReason);
					}
					else
					{						               
						$("#emailresultstxt").html(d.Response);					
					}
                },
                error: function (xhr, textStatus, errorThrown) {
                    $("#emailresultstxt").html("Error.");
                    $("#emailBtn").prop("disabled", false);
                    $(".spinner").hide();
                    console.error(xhr, textStatus);
                },
                beforeSend: function (xhr, settings) {
                    $("#emailresultstxt").html("Waiting..");
                    $("#emailBtn").prop("disabled", true);
                    $(".spinner").show();
                }
            });
        }
        else {
            console.error("Email address is blank, or there are no test results to send.");
        }
    });

    //Allows the person to hide and see the results of the test in the output modal. This is useful if email errors out.
    $("#viewresultsbtn").click(function () {
        if ($("#testresults").is(":hidden")) {
            $("#testresults").fadeIn(function () { $("#viewresultsbtn").html("Hide results."); });
        }
        else {
            $("#testresults").fadeOut(function () { $("#viewresultsbtn").html("View results?"); });
        }
    });

    $(".card").click(function () {
        totalclicks++; //increment our click counter.
        //Note in order to end the game the person has to click MAXGAMES + 1 times. This is ok becuase the person is just clicking away.
        if (totalclicks <= MAXGAMES) {

            var clicked = $(this).attr("id"); //Get the id of the clicked deck
            switch (clicked) {                //Do something with that clicked deck id.
                case "card-one":
                    if (deckAclicks === DECKA_PENALTY.length)
                    {
                        //if we are at the end of the array reset our position back to the beginning. this is described in variants of this test.
                        deckAclicks = 0;
                    }   
                    penalty = DECKA_PENALTY[deckAclicks]; //get the penalty value
                    netgain = DECKA_WIN + penalty;          //get the net gain                    
                    $("#winamt").html(DECKA_WIN);           //output our win amount                   
                    deckAclicks++;                        //increment our position for penalty lookup
                    selectedCards.push("A");                //Add to our output of selected cards.
                    //$("#deck-one-clicks").html(deckoneclicks); debugging                    
                    break;

                case "card-two":
                    if (deckBclicks === DECKB_PENALTY.length) {
                        //if we are at the end of the array reset our position back to the beginning. this is described in variants of this test.
                        deckBclicks = 0;
                    }
                    penalty = DECKB_PENALTY[deckBclicks]; //get the penalty value
                    netgain = DECKB_WIN + penalty;          //get the net gain                    
                    $("#winamt").html(DECKB_WIN);           //output our win amount                   
                    deckBclicks++;                        //increment our position for penalty lookup
                    selectedCards.push("B");                //Add to our output of selected cards.
                    //$("#deck-one-clicks").html(deckoneclicks); debugging          
                    break;

                case "card-three":
                    if (deckCclicks === DECKC_PENALTY.length) {
                        //if we are at the end of the array reset our position back to the beginning. this is described in variants of this test.
                        deckCclicks = 0;
                    }
                    penalty = DECKC_PENALTY[deckCclicks]; //get the penalty value
                    netgain = DECKC_WIN + penalty;          //get the net gain                    
                    $("#winamt").html(DECKC_WIN);           //output our win amount                   
                    deckCclicks++;                        //increment our position for penalty lookup
                    selectedCards.push("C");                //Add to our output of selected cards.
                    //$("#deck-one-clicks").html(deckoneclicks); debugging                    
                    break;

                case "card-four":
                    if (deckDclicks === DECKD_PENALTY.length) {
                        //if we are at the end of the array reset our position back to the beginning. this is described in variants of this test.
                        deckDclicks = 0;
                    }
                    penalty = DECKD_PENALTY[deckDclicks]; //get the penalty value
                    netgain = DECKD_WIN + penalty;          //get the net gain                    
                    $("#winamt").html(DECKD_WIN);           //output our win amount                   
                    deckDclicks++;                        //increment our position for penalty lookup
                    selectedCards.push("D");                //Add to our output of selected cards.
                    //$("#deck-one-clicks").html(deckoneclicks); debugging                    
                    break;
            }

            $("#penaltyamt").html(penalty.toString());  //output the penalty
            $("#netgains").html(netgain.toString());    //output the net gain or loss
            totalcash += netgain;                       //increment our totals
            //change the color of the font if we win or lose
            if (netgain <= 0)
                $(".outputtext").css("color", "red");
            else
                $(".outputtext").css("color", "blue");

            if (totalcash < 0) totalcash = 0; //if total cash is negative make it 0.			               
            $("#totalmoney").html("$" + totalcash.toString());
            //calculate our cash bar and display
            var cashpilebarvalue = 100 * totalcash / CASHMAX;
            $("#cashpilebar").css("width", cashpilebarvalue.toString() + "%"); //grow or shrink the progress bar
            $("#cashpileamt").html("$" + totalcash);                            //change the label in the progress bar
        }
        else //game over 
        {
            $("#modal-gameend").modal('show');              //show the game end modal  
            var prettyprnt = selectedCards.join(", ");      //setup pretty printing
            $("#testresults").html(prettyprnt);             //output the pretty print            
            mail_attachment = prettyprnt.replace(/\s+/g, ""); //remove all white space
        }
    });
});