// Load our JSON file
var myJson = {};
$.ajax({
  url: "regulation.json",
  dataType: "json",
  success: function(json) {
    myJson = json;
    console.log(myJson)
  }
});

function getObjects(obj, key, val) {
  var objects = [];
  for (var i in obj) {
    if (!obj.hasOwnProperty(i)) continue;
    if (typeof obj[i] == "object") {
      objects = objects.concat(getObjects(obj[i], key, val));
    } else if (i == key && obj[key] == val) {
      objects.push(obj);
    }
  }
  return objects;
}

// Recursively loop through JSON file
function recursiveLoop(obj) {
  for (var k in obj) {
    var counter = 0;
    if (obj[k].hasOwnProperty("name")) {
      createDiv(obj[k], counter);
      recursiveLoop(obj[k]);
    }
    if (obj[k].hasOwnProperty("requirements")) {
      recursiveLoop(obj[k].requirements);
      var child = obj[k].requirements;
      createChildElement(obj[k], child, counter);
    }
    if (obj[k].hasOwnProperty("approvedCountry")) {
      recursiveLoop(obj[k].approvedCountry);
      var child_obj = obj[k].approvedCountry;
      createNestedPanelElement(obj[k], child_obj, counter)
    }
    if (typeof obj[k] == "object" && obj[k] !== null) {
      recursiveLoop(obj[k]);
    }
    counter++;
  }
}


var parentCategory = "";
// Create a new div for each business Rule
function createDiv(obj, counter) {
  text = obj.name;
  category = obj.category;
  parentCategory = text + counter;
  var title = returnTitle(text);
  var type = category;
  var view_data = {
    text: text,
    counter: counter,
    title: title,
    type: type
  }
  var template = $('#bizRuleCardTpl').html();
  $("#list").append(Mustache.to_html(template, view_data));
}

// Create a new child element for nested properties
function createChildElement(obj, child, counter) {
  var parent = document.getElementById(obj.name);
  var view_data = {
    id: obj.name + counter
  }
  var template = $('#benefitPanelTpl').html();
  $(parent).append(Mustache.to_html(template, view_data));
  for (var key in child) {
    var panel_body_id = "panel" + obj.name + counter;
    var panel_body = document.getElementById(panel_body_id);
    if (child.hasOwnProperty(key)) {
      var view_data = {
        key: key,
        requirement_name: returnRequirementKey(key),
        requirement_value: child[key]
      }
      var template = $('#requirementTpl').html();
      $(panel_body).append(Mustache.to_html(template, view_data));
    }
  }
}

function createNestedChildElement(obj, child, parent) {
  var parentPanel = "panel" + parentCategory;
  var parent = document.getElementById(parentPanel);
  for (var key in child) {
    if (child.hasOwnProperty(key)) {
      var view_data = {
        key: key,
        requirement_value: returnRequirementKey(key),
        requirement_name: child[key]
      }
      var template = $('#requirementTpl').html();
      $(parent).append(Mustache.to_html(template, view_data));
      // removeAlreadyReceiving();
    }
  }
}

function createNestedPanelElement(obj, child, parent) {
  var parentPanel = "panel" + parentCategory;
  var parent = document.getElementById(parentPanel)
  // Here we loop through a new object simply to extract the titles of the objects
  var keyNames = Object.keys(obj)
  // We assign them to new nested panels
  for (var key in keyNames) {
    console.log(keyNames[key])
    var body_key = key+keyNames[key]
    var view_data = {
      title: keyNames[key],
      key: key,
      type: keyNames[key],
      requirement_name_name: returnRequirementKey(key),
      body_key: body_key
    }

    var template = $('#requirementsPanelTpl').html();
    $(parent).append(Mustache.to_html(template, view_data));

    for (var key in child) {
      console.log(child)
      if (child.hasOwnProperty(key)) {
        var view_data = {
          key: key,
          requirement_value: returnRequirementKey(key),
          requirement_name: child[key]
        }
        var template = $('#requirementTpl').html();
        $("#"+body_key).append(Mustache.to_html(template, view_data));
        // $(parent).append(Mustache.to_html(template, view_data));
        // removeAlreadyReceiving();
      }
    }
  }
}

// If the p tag rendered is the nested property alreadyReceiving, which as properies itself\
// Then don't render it
function removeAlreadyReceiving() {
  if ($('.requirement:contains("alreadyReceiving")').length > 0) {
    $('.requirement:contains("alreadyReceiving")').remove();
  }
}

function returnTitle(text) {
  return text.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function returnRequirementKey(text) {
  switch (text) {
    case "applicantMinimumAge":
      return "Minimum age of applicant";
    case "yearsInNzSince20":
      return "Years applicant should have spent in NZ since turning 20";
    case "yearsInNzSince50":
      return "Years applicant should have spent in NZ since turning 50";
    case "citizenOrResident?":
      return "Is the applicant a citizen or Resident of NZ?";
    case "livingInNZ?":
      return "Is the applicant currently living in NZ";
    case "ServedInMilitaryOrEmergency?":
      return "Applicant Served in Military or in emergency?";
    case "relatedOrGuardian?":
      return "Applicant is family or guardian?";
    case "completedIncomeAndAssetTest?":
      return "Have you completed an income and asset test?";
    case "hasExistingBenefit?":
      return "Are you currently on another benefit?";
    case "organiser?":
      return "Are you the organiser of the event?"
    case "pension?":
      return "Are you currently receiving a pension?"
    case "ongoingCosts?":
      return "Do you have ongoing costs that you cannot currently cover?"
    case "SocialHousingBenefit?":
      return "Are you currently in receivership of a housing benefit?"
    default:
      return text;
  }
}

function countRequirements(div) {
  var count = document.getElementById(div.id).childElementCount;
  return count;
}

var lifeEventClicked = function() {
  var eventType = $(this).attr('data-event-type');
  if ($(this).is(":checked")) {
    recursiveLoop(getObjects(myJson, "category", eventType));
    // Find most common requirement
    // Ask question related to most common requirement
    askQuestion(returnTopRequirement());

    $(".biz-rule-card").each(function showRequirementCount(i, card) {
      var view_data = {
        id: $(card).attr('id'),
        count: $(card).find('.requirement').length
      }
      var template = $('#requirementsNumTpl').html();
      $(card).find('.card-preview').append(Mustache.to_html(template, view_data));
    });
  } else {
    $('[data-event-type="' + eventType + '"].biz-rule-card').remove();
    askQuestion(returnTopRequirement());
  }
};

$("#fancy-checkbox-immigration, #fancy-checkbox-retired, #fancy-checkbox-health, #fancy-checkbox-childcare").change(lifeEventClicked);

function returnTopRequirement() {
  var array = [
    { applicantMinimumAge: $("p[id*='applicantMinimumAge']").length },
    { citizenOrResident: $("p[id*='citizenOrResident?']").length },
    { livingInNZ: $("p[id*='livingInNZ?']").length },
    { yearsInNzSince50: $("p[id*='yearsInNzSince50']").length },
    { yearsInNzSince20: $("p[id*='yearsInNzSince20']").length },
    { pension: $("p[id*='pension?']").length },
    { organiser: $("p[id*='organiser?']").length },
    { pension: $("p[id*='pension?']").length },
    { relatedOrGuardian: $("p[id*='relatedOrGuardian?']").length },
    {
      completedIncomeAndAssetTest: $("p[id*='completedIncomeAndAssetTest?']")
        .length
    },
    {
      ServedInMilitaryOrEmergency: $("p[id*='ServedInMilitaryOrEmergency?']")
        .length
    },
    { organiser: $("p[id*='organiser?']").length }
  ];
  var highest = array.sort(function(a, b) {
    return a.ValueA - b.ValueA;
  });
  return highest[0];
}

function askQuestion(requirementCount) {
  var question = requirementCount;
  for (var key in question) {
    if ($("#input input:checkbox:checked").length > 0) {
      var divRow = $(document.createElement("div")).addClass("row");
      var h2 = $(document.createElement("h2")).text("First Question");
      divRow.append(h2.append());
      var view_data = {
        key: returnRequirementKey(key),
        question_key: question[key]
      }
      var template = $('#questionTpl').html();
      $("#criteria1").html(Mustache.to_html(template, view_data));
      console.log(key + ":" + question[key]);
      if ($("#fancy-checkbox-question1_1").length > 0) {
        $("#fancy-checkbox-question1_1").change(function() {
          if ($(this).is(":checked")){
            console.log('checked 1')
          }
        })
      }
      if ($("#fancy-checkbox-question1_2").length > 0) {
        $("#fancy-checkbox-question1_2").change(function() {
          if ($(this).is(":checked")){
            console.log("checked 2")
          }
        })
      }
    } else {
      $("#criteria1").html("");
    }
  }
}


var user = {}
