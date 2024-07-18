# Styling

To enhance the visual appeal of our application, we'll implement some basic styling. While this guide primarily focuses on the technical aspects of setting up messaging, introducing you to CSS (Cascading Style Sheets) is essential for creating a more appealing user interface.

We'll create a traditional CSS file and import it directly into our JSX files. Note that these styles are global and can affect other parts of your application if not managed properly.

To use these styles, import the CSS [file](/client/src/components/style/StyleSheet.css) into all of your components:

```javascript
import "./style/StyleSheet.css";
```

**Important:** Make sure you've used the same `classNames` for your components as those used throughout this guide. If you've followed along closely, you should be able to import this CSS file into all of your components, and the styles will apply correctly. If you've used different classNames, you'll need to adjust either your component classNames or the CSS selectors to match.

Let's take a look at how our landing page appears so far. I'll be using an iPhone 14 view for demonstration:

![Login](/images/login.png)
![Signup](/images/signup.png)
![NotFound](/images/notFound.png)

Let's finish our tutorial here with the [conclusion](conclusion.md).
