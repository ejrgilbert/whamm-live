<b>Note</b>: A good guide is available in this [Live Whamm demo video](https://www.youtube.com/watch?v=RmWPOX-mJ4g) on YouTube which would be a great resource to get started!

### Getting started
To begin using Live Whamm, open the extension from the activity bar on the left-hand side of VSCode. Look for the Live Whamm icon: ![Live-Whamm](./media/live-whamm.svg). Clicking it opens the Live Whamm panel. From here:

* Click “Open Whamm File”
    Select your Whamm monitor script (`.mm`) that defines the instrumentation logic.
    <br>
* Choose Your Target:
    After loading the Whamm script, you can select the wasm application target(s). Alternatively, you can target the Wizard engine.
    <br>
* Behind the Scenes:
    Once a target is selected, the extension calls the Whamm API and builds the relevant models. This process is automatic.

Here is a screenshot from VSCode:
![extension screenshot](./media/guide/getting-started.png)

### Targeting `wasm`
Once you've selected your target `wasm` and clicked the "Inject Code" button, Live Whamm performs a dry instrumentation and displays the new `wat` content in the webview.

> [!TIP]
> We recommend having this webview view side-by-side with your `.mm` file. This layout would be most helpful to see both the injection logic and its effects at the same time.

> [!NOTE]  
> Live Whamm performs a dry run i.e the selected `wasm` target is not actually modified. This visualization is purely for inspection and understanding.

The new injections are highlighted in blue. Note that, the `func probe`, `op body probe` and `local` injections are not inserted as actual lines in the injected `wat`. Instead, they appear as visual circles beside the relevant code locations, helping you understand their placement without cluttering the code.

Moreover, you’ll notice a legend in the webview interface that explains the color and symbol coding for different types of injections. Here is a summary:
![wasm highlight legend](image.png)

##### Using Live Whamm for `wasm` targets
After loading the new injections, you can begin exploring:

* Click anywhere in your `.mm` script to see which `wat` lines or visual markers were caused by that particular logic.

* If the cursor is linked to the cause of one or more injections, the extension highlights the corresponding span in the `.mm` script and the resulting match locations across all selected targets.
The span will have the same highlight color as its resulting injections.

![Live Whamm in action](media/guide/live-whamm-usage.png)
Here is what it looks like in VSCode itself: <small>(In this case, I clicked on line 8's `taken` variable in the selected `.mm` file)</small>:
![Screenshot: Live Whamm in action](media/guide/live-whamm-usage-screenshot.png)


> [!TIP]
> You can also cycle through the different injections in the target via the navigation interface.

* Alternatively, you can also click on any injected `wat` line or circle visual marker in the webview.

* If you do, Live Whamm will highlight:

    * the cause of that injection in the `.mm` script.

    * All other `wat` injections caused by the same logic across all targets.

This bidirectional traceability and visibility is core to Live Whamm’s value.

### Targeting wizard 
@TODO

### Support for multiple targets 
@TODO

### Live programming environment
@TODO