import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CardDetail, CardDetailFacts, CardDetailLabel } from "./card-detail";
import { jonah, noor } from "./fixtures";
import { GameButton } from "./game-button";
import { GameField } from "./game-field";
import { GameSwitch } from "./game-switch";
import { Sticker } from "./sticker";
import type { StickerPerson } from "./sticker-view";

type SampleProps = { person: StickerPerson; locked?: boolean; maybe?: boolean };

function Sample({ person, locked = false, maybe = false }: SampleProps) {
  const firstName = person.name.split(" ")[0];
  return (
    <CardDetail
      card={
        // The album overlay's open card: the small card at the large card's size.
        <div style={{ zoom: 1.7 }}>
          <Sticker person={person} mode={locked ? "locked" : maybe ? "maybe" : "collected"} />
        </div>
      }
      cardFooter={
        locked ? null : (
          <div className="flex items-center gap-3">
            <GameSwitch id="maybe" defaultChecked={maybe} />
            <label htmlFor="maybe" className="font-medium text-button-sm">
              Could be my welcomer
            </label>
          </div>
        )
      }
      panel={
        <div className="flex flex-col gap-8">
          <h1 className="font-game-serif text-hero-md">{person.name}</h1>
          <CardDetailFacts
            facts={[
              { label: "Location", value: locked ? null : person.city },
              { label: "Fun fact", value: locked ? null : person.fact },
              { label: "Ask me about", value: locked ? null : person.ask },
            ]}
          />
          <div className="flex flex-col items-start gap-5">
            <div className="flex w-full flex-col gap-2.5">
              <CardDetailLabel>Your notes</CardDetailLabel>
              <GameField
                multiline
                hideLabel
                label={`Your notes on ${firstName}`}
                placeholder={`What did you learn about ${firstName}?`}
                rows={4}
                help={locked ? "Only you see this" : "Saved"}
                defaultValue={
                  locked ? "" : "Runs the fantasy league. Ask about the trade deadline."
                }
              />
            </div>
            {locked ? <GameButton>Collect sticker</GameButton> : null}
          </div>
        </div>
      }
    />
  );
}

const meta = {
  title: "Game/Layout/CardDetail",
  component: Sample,
  parameters: { layout: "padded" },
  args: { person: jonah },
} satisfies Meta<typeof Sample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collected: Story = {};
export const OnMaybeList: Story = { args: { maybe: true } };
export const Locked: Story = { args: { person: noor, locked: true } };
